import { Configuration } from "../configuration/Configuration.js";
import { ILog } from "../logging/ILog.js";
import { Event } from "../models/Event.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { IStorageItem } from "../storage/IStorageItem.js";
import { Response } from "../submission/Response.js";

export class DefaultEventQueue implements IEventQueue {
  /**
   * A list of handlers that will be fired when events are submitted.
   * @type {Array}
   * @private
   */
  private _handlers: Array<
    (events: Event[], response: Response) => void
  > = [];

  /**
   * Suspends processing until the specified time.
   * @type {Date}
   * @private
   */
  private _suspendProcessingUntil: Date;

  /**
   * Discards queued items until the specified time.
   * @type {Date}
   * @private
   */
  private _discardQueuedItemsUntil: Date;

  /**
   * Returns true if the queue is processing.
   * @type {boolean}
   * @private
   */
  private _processingQueue: boolean = false;

  /**
   * Processes the queue every xx seconds.
   * @type {Timer}
   * @private
   */
  private _queueTimerId: any;

  constructor(private config: Configuration) {}

  /** Enqueue an event and resumes any queue timers */
  public enqueue(event: Event): void {
    const eventWillNotBeQueued: string = "The event will not be queued."; // optimization for minifier.
    const config: Configuration = this.config; // Optimization for minifier.
    const log: ILog = config.services.log; // Optimization for minifier.

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

    this.ensureQueueTimer();

    const timestamp = config.services.storage.queue.save(event);
    const logText = `type=${event.type} ${event.reference_id ? "refid=" + event.reference_id : ""} source=${event.source} message=${event.message}`;
    if (timestamp) {
      log.info(`Enqueuing event: ${timestamp} ${logText}`);
    } else {
      log.error(`Could not enqueue event: ${logText}`);
    }
  }

  /** Processes all events in the queue and resumes any queue timers */
  public async process(): Promise<void> {
    const queueNotProcessed: string = "The queue will not be processed."; // optimization for minifier.
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
    this.ensureQueueTimer();

    try {
      const events = this.config.services.storage.queue.get(this.config.submissionBatchSize);
      if (!events || events.length === 0) {
        this._processingQueue = false;
        return;
      }

      log.info(`Sending ${events.length} events to ${this.config.serverUrl}`);
      const response = await this.config.services.submissionClient.submitEvents(events.map((e) => e.value));
      this.processSubmissionResponse(response, events);
      this.eventsPosted(events.map((e) => e.value), response);
      log.trace("Finished processing queue.");
      this._processingQueue = false;
    } catch (ex) {
      log.error(`Error processing queue: ${ex}`);
      this.suspendProcessing();
      this._processingQueue = false;
    }
  }

  /** Suspends queue timers */
  public suspend(): Promise<void> {
    this._queueTimerId = clearInterval(this._queueTimerId);
    return Promise.resolve();
  }

  /** Suspends processing of events for a specific duration */
  public suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void {
    const config: Configuration = this.config; // Optimization for minifier.

    if (!durationInMinutes || durationInMinutes <= 0) {
      durationInMinutes = 5;
    }

    config.services.log.info(`Suspending processing for ${durationInMinutes} minutes.`);
    this._suspendProcessingUntil = new Date(
      new Date().getTime() + (durationInMinutes * 60000),
    );

    if (discardFutureQueuedItems) {
      this._discardQueuedItemsUntil = this._suspendProcessingUntil;
    }

    if (clearQueue) {
      // Account is over the limit and we want to ensure that the sample size being sent in will contain newer errors.
      config.services.storage.queue.clear();
    }
  }

  // TODO: See if this makes sense.
  public onEventsPosted(handler: (events: Event[], response: Response) => void): void {
    handler && this._handlers.push(handler);
  }

  private eventsPosted(events: Event[], response: Response) {
    const handlers = this._handlers; // optimization for minifier.
    for (const handler of handlers) {
      try {
        handler(events, response);
      } catch (ex) {
        this.config.services.log.error(`Error calling onEventsPosted handler: ${ex}`);
      }
    }
  }

  private areQueuedItemsDiscarded(): boolean {
    return this._discardQueuedItemsUntil &&
      this._discardQueuedItemsUntil > new Date();
  }

  private ensureQueueTimer(): void {
    if (!this._queueTimerId) {
      // TODO: Fix awaiting promise.
      this._queueTimerId = setInterval(() => void this.onProcessQueue(), 10000);
    }
  }

  private isQueueProcessingSuspended(): boolean {
    return this._suspendProcessingUntil &&
      this._suspendProcessingUntil > new Date();
  }

  private async onProcessQueue(): Promise<void> {
    if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
      await this.process();
    }
  }

  private processSubmissionResponse(response: Response, events: IStorageItem[]): void {
    const noSubmission: string = "The event will not be submitted"; // Optimization for minifier.
    const config: Configuration = this.config; // Optimization for minifier.
    const log: ILog = config.services.log; // Optimization for minifier.

    if (response.status === 202) {
      log.info(`Sent ${events.length} events`);
      this.removeEvents(events);
      return;
    }

    if (response.status === 429 || response.rateLimitRemaining === 0 || response.status === 503) {
      // You are currently over your rate limit or the servers are under stress.
      log.error("Server returned service unavailable");
      this.suspendProcessing();
      return;
    }

    if (response.status === 402) {
      // If the organization over the rate limit then discard the event.
      log.info("Too many events have been submitted, please upgrade your plan");
      this.suspendProcessing(null, true, true);
      return;
    }

    if (response.status === 401 || response.status === 403) {
      // The api key was suspended or could not be authorized.
      log.info(`Unable to authenticate, please check your configuration. ${noSubmission}`);
      this.suspendProcessing(15);
      this.removeEvents(events);
      return;
    }

    if (response.status === 400 || response.status === 404) {
      // The service end point could not be found.
      log.error(`Error while trying to submit data: ${response.message}`);
      this.suspendProcessing(60 * 4);
      this.removeEvents(events);
      return;
    }

    if (response.status === 413) {
      const message = "Event submission discarded for being too large.";
      if (config.submissionBatchSize > 1) {
        log.error(`${message} Retrying with smaller batch size.`);
        config.submissionBatchSize = Math.max(
          1,
          Math.round(config.submissionBatchSize / 1.5),
        );
      } else {
        log.error(`${message} ${noSubmission}`);
        this.removeEvents(events);
      }

      return;
    }

    log.error(
      `Error submitting events: ${response.message ||
        "Please check the network tab for more info."}`,
    );
    this.suspendProcessing();
  }

  private removeEvents(events: IStorageItem[]) {
    for (let index = 0; index < (events || []).length; index++) {
      this.config.services.storage.queue.remove(events[index].timestamp);
    }
  }
}
