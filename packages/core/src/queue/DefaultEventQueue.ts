import { Configuration } from "../configuration/Configuration.js";
import { ILog } from "../logging/ILog.js";
import { Event } from "../models/Event.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { Response } from "../submission/Response.js";

interface EventQueueItem {
  file: string,
  event: Event
}

export class DefaultEventQueue implements IEventQueue {
  /**
   * A list of handlers that will be fired when events are submitted.
   * @type {Array}
   * @private
   */
  private _handlers: Array<(events: Event[], response: Response) => Promise<void>> = [];

  /**
   * Suspends processing until the specified time.
   * @type {Date}
   * @private
   */
  private _suspendProcessingUntil?: Date;

  /**
   * Discards queued items until the specified time.
   * @type {Date}
   * @private
   */
  private _discardQueuedItemsUntil?: Date;

  /**
   * Returns true if the queue is processing.
   * @type {boolean}
   * @private
   */
  private _processingQueue = false;

  /**
   * Processes the queue every xx seconds.
   * @type {Interval}
   * @private
   */
  private _queueIntervalId: ReturnType<typeof setInterval> | undefined;

  private readonly QUEUE_PREFIX: string = "q:";
  private _lastFileTimestamp = 0;
  private _queue: EventQueueItem[] = [];
  private _loadPersistedEvents = true;

  constructor(
    private config: Configuration,
    private maxItems: number = 250
  ) { }

  public async enqueue(event: Event): Promise<void> {
    const eventWillNotBeQueued = "The event will not be queued.";
    const config: Configuration = this.config;
    const log: ILog = config.services.log;

    if (!config.enabled) {
      log.info(`Configuration is disabled. ${eventWillNotBeQueued}`);
      return;
    }

    if (!config.isValid) {
      log.info(`Invalid Api Key. ${eventWillNotBeQueued}`);
      return;
    }

    if (this.areQueuedItemsDiscarded()) {
      log.info(`Queue items are currently being discarded. ${eventWillNotBeQueued}`);
      return;
    }

    const file = await this.enqueueEvent(event);
    const logText = `type=${<string>event.type} reference_id=${<string>event.reference_id} source=${<string>event.source} message=${<string>event.message}`;
    log.info(`Enqueued event: ${file} (${logText})`);
  }

  public async process(): Promise<void> {
    const queueNotProcessed = "The queue will not be processed";
    const { log } = this.config.services;

    if (this._processingQueue) {
      return;
    }

    log.trace("Processing queue...");
    if (!this.config.enabled) {
      log.info(`Configuration is disabled: ${queueNotProcessed}`);
      return;
    }

    if (!this.config.isValid) {
      log.info(`Invalid Api Key: ${queueNotProcessed}`);
      return;
    }

    this._processingQueue = true;
    try {
      if (this._loadPersistedEvents) {
        if (this.config.usePersistedQueueStorage) {
          await this.loadEvents();
        }

        this._loadPersistedEvents = false;
      }

      const items = this._queue.slice(0, this.config.submissionBatchSize);
      if (!items || items.length === 0) {
        this._processingQueue = false;
        return;
      }

      log.info(`Sending ${items.length} events to ${this.config.serverUrl}`);
      const events = items.map(i => i.event);
      const response = await this.config.services.submissionClient.submitEvents(events);
      await this.processSubmissionResponse(response, items);
      await this.eventsPosted(events, response);
      log.trace("Finished processing queue");
      this._processingQueue = false;
    } catch (ex) {
      log.error(`Error processing queue: ${ex instanceof Error ? ex.message : ex + ''}`);
      await this.suspendProcessing();
      this._processingQueue = false;
    }
  }

  public startup(): Promise<void> {
    if (!this._queueIntervalId) {
      // TODO: Fix awaiting promise.
      this._queueIntervalId = setInterval(() => void this.onProcessQueue(), 10000);
    }

    return Promise.resolve();
  }

  public suspend(): Promise<void> {
    clearInterval(this._queueIntervalId);
    this._queueIntervalId = undefined;
    return Promise.resolve();
  }

  public async suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): Promise<void> {
    const config: Configuration = this.config; // Optimization for minifier.

    const currentDate = new Date();
    if (!durationInMinutes || durationInMinutes <= 0) {
      durationInMinutes = Math.ceil(currentDate.getMinutes() / 15) * 15 - currentDate.getMinutes();
    }

    config.services.log.info(`Suspending processing for ${durationInMinutes} minutes.`);
    this._suspendProcessingUntil = new Date(currentDate.getTime() + (durationInMinutes * 60000));

    if (discardFutureQueuedItems) {
      this._discardQueuedItemsUntil = this._suspendProcessingUntil;
    }

    if (clearQueue) {
      // Account is over the limit and we want to ensure that the sample size being sent in will contain newer errors.
      await this.removeEvents(this._queue);
    }
  }

  // TODO: See if this makes sense.
  public onEventsPosted(handler: (events: Event[], response: Response) => Promise<void>): void {
    handler && this._handlers.push(handler);
  }

  private async eventsPosted(events: Event[], response: Response): Promise<void> {
    const handlers = this._handlers;
    for (const handler of handlers) {
      try {
        await handler(events, response);
      } catch (ex) {
        this.config.services.log.error(`Error calling onEventsPosted handler: ${ex instanceof Error ? ex.message : ex + ''}`);
      }
    }
  }

  private areQueuedItemsDiscarded(): boolean {
    return this._discardQueuedItemsUntil &&
      this._discardQueuedItemsUntil > new Date() || false;
  }

  private isQueueProcessingSuspended(): boolean {
    return this._suspendProcessingUntil &&
      this._suspendProcessingUntil > new Date() || false;
  }

  private async onProcessQueue(): Promise<void> {
    if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
      await this.process();
    }
  }

  private async processSubmissionResponse(response: Response, items: EventQueueItem[]): Promise<void> {
    const noSubmission = "The event will not be submitted";
    const config: Configuration = this.config;
    const log: ILog = config.services.log;

    if (response.status === 202) {
      log.info(`Sent ${items.length} events`);
      await this.removeEvents(items);
      return;
    }

    if (response.status === 429 || response.rateLimitRemaining === 0 || response.status === 503) {
      // You are currently over your rate limit or the servers are under stress.
      log.error("Server returned service unavailable");
      await this.suspendProcessing();
      return;
    }

    if (response.status === 402) {
      // If the organization over the rate limit then discard the event.
      log.info("Too many events have been submitted, please upgrade your plan");
      await this.suspendProcessing(0, true, true);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      // The api key was suspended or could not be authorized.
      log.info(`Unable to authenticate, please check your configuration. ${noSubmission}`);
      await this.suspendProcessing(15);
      await this.removeEvents(items);
      return;
    }

    if (response.status === 400 || response.status === 404) {
      // The service end point could not be found.
      log.error(`Error while trying to submit data: ${response.message}`);
      await this.suspendProcessing(60 * 4);
      await this.removeEvents(items);
      return;
    }

    if (response.status === 413) {
      const message = "Event submission discarded for being too large.";
      if (config.submissionBatchSize > 1) {
        log.error(`${message} Retrying with smaller batch size.`);
        config.submissionBatchSize = Math.max(1, Math.round(config.submissionBatchSize / 1.5));
      } else {
        log.error(`${message} ${noSubmission}`);
        await this.removeEvents(items);
      }

      return;
    }

    log.error(`Error submitting events: ${response.message || "Please check the network tab for more info."}`);
    await this.suspendProcessing();
  }

  private async loadEvents(): Promise<void> {
    if (this.config.usePersistedQueueStorage) {
      try {
        const storage = this.config.services.storage;
        const files: string[] = await storage.keys();

        for (const file of files) {
          if (file?.startsWith(this.QUEUE_PREFIX)) {
            const json = await storage.getItem(file);
            if (json)
              this._queue.push({ file, event: JSON.parse(json) as Event });
          }
        }
      } catch (ex) {
        this.config.services.log.error(`Error loading queue items from storage: ${ex instanceof Error ? ex.message : ex + ''}`)
      }
    }
  }

  private async enqueueEvent(event: Event): Promise<string> {
    this._lastFileTimestamp = Math.max(Date.now(), this._lastFileTimestamp + 1);
    const file = `${this.QUEUE_PREFIX}${this._lastFileTimestamp}.json`;

    const { storage, log } = this.config.services;
    const useStorage: boolean = this.config.usePersistedQueueStorage;
    if (this._queue.push({ file, event }) > this.maxItems) {
      log.trace("Removing oldest queue entry: maxItems exceeded");
      const item = this._queue.shift();
      if (useStorage && item) {
        await storage.removeItem(item.file);
      }
    }

    if (useStorage) {
      try {
        await storage.setItem(file, JSON.stringify(event));
      } catch (ex) {
        log.error(`Error saving queue item to storage: ${ex instanceof Error ? ex.message : ex + ''}`)
      }
    }

    return file;
  }

  private async removeEvents(items: EventQueueItem[]): Promise<void> {
    const files = items.map(i => i.file);
    if (this.config.usePersistedQueueStorage) {
      for (const file of files) {
        try {
          await this.config.services.storage.removeItem(file);
        } catch (ex) {
          this.config.services.log.error(`Error removing queue item from storage: ${ex instanceof Error ? ex.message : ex + ''}`)
        }
      }
    }

    this._queue = this._queue.filter(i => !files.includes(i.file));
  }
}
