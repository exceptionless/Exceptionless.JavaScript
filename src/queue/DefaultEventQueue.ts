import { Configuration } from '../configuration/Configuration';
import { ILog } from '../logging/ILog';
import { IEvent } from '../models/IEvent';
import { IEventQueue } from '../queue/IEventQueue';
import { IStorageItem } from '../storage/IStorageItem';
import { SubmissionResponse } from '../submission/SubmissionResponse';

export class DefaultEventQueue implements IEventQueue {
  /**
   * The configuration object.
   * @type {Configuration}
   * @private
   */
  private _config: Configuration;

  /**
   * A list of handlers that will be fired when events are submitted.
   * @type {Array}
   * @private
   */
  private _handlers: Array<(events: IEvent[], response: SubmissionResponse) => void> = [];

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
  private _queueTimer: any;

  constructor(config: Configuration) {
    this._config = config;
  }

  public enqueue(event: IEvent): void {
    const eventWillNotBeQueued: string = 'The event will not be queued.'; // optimization for minifier.
    const config: Configuration = this._config; // Optimization for minifier.
    const log: ILog = config.log; // Optimization for minifier.

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

    const timestamp = config.storage.queue.save(event);
    const logText = `type=${event.type} ${!!event.reference_id ? 'refid=' + event.reference_id : ''}`;
    if (timestamp) {
      log.info(`Enqueuing event: ${timestamp} ${logText}`);
    } else {
      log.error(`Could not enqueue event ${logText}`);
    }
  }

  public process(isAppExiting?: boolean): void {
    const queueNotProcessed: string = 'The queue will not be processed.'; // optimization for minifier.
    const config: Configuration = this._config; // Optimization for minifier.
    const log: ILog = config.log; // Optimization for minifier.

    if (this._processingQueue) {
      return;
    }

    log.info('Processing queue...');
    if (!config.enabled) {
      log.info(`Configuration is disabled. ${queueNotProcessed}`);
      return;
    }

    if (!config.isValid) {
      log.info(`Invalid Api Key. ${queueNotProcessed}`);
      return;
    }

    this._processingQueue = true;
    this.ensureQueueTimer();

    try {
      const events = config.storage.queue.get(config.submissionBatchSize);
      if (!events || events.length === 0) {
        this._processingQueue = false;
        return;
      }

      log.info(`Sending ${events.length} events to ${config.serverUrl}.`);
      config.submissionClient.postEvents(events.map((e) => e.value), config, (response: SubmissionResponse) => {
        this.processSubmissionResponse(response, events);
        this.eventsPosted(events.map((e) => e.value), response);
        log.info('Finished processing queue.');
        this._processingQueue = false;
      }, isAppExiting);
    } catch (ex) {
      log.error(`Error processing queue: ${ex}`);
      this.suspendProcessing();
      this._processingQueue = false;
    }
  }

  public suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void {
    const config: Configuration = this._config; // Optimization for minifier.

    if (!durationInMinutes || durationInMinutes <= 0) {
      durationInMinutes = 5;
    }

    config.log.info(`Suspending processing for ${durationInMinutes} minutes.`);
    this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));

    if (discardFutureQueuedItems) {
      this._discardQueuedItemsUntil = this._suspendProcessingUntil;
    }

    if (clearQueue) {
      // Account is over the limit and we want to ensure that the sample size being sent in will contain newer errors.
      config.storage.queue.clear();
    }
  }

  public onEventsPosted(handler: (events: IEvent[], response: SubmissionResponse) => void): void {
    !!handler && this._handlers.push(handler);
  }

  private eventsPosted(events: IEvent[], response: SubmissionResponse) {
    const handlers = this._handlers; // optimization for minifier.
    for (const handler of handlers) {
      try {
        handler(events, response);
      } catch (ex) {
        this._config.log.error(`Error calling onEventsPosted handler: ${ex}`);
      }
    }
  }

  private areQueuedItemsDiscarded(): boolean {
    return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
  }

  private ensureQueueTimer(): void {
    if (!this._queueTimer) {
      this._queueTimer = setInterval(() => this.onProcessQueue(), 10000);
    }
  }

  private isQueueProcessingSuspended(): boolean {
    return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
  }

  private onProcessQueue(): void {
    if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
      this.process();
    }
  }

  private processSubmissionResponse(response: SubmissionResponse, events: IStorageItem[]): void {
    const noSubmission: string = 'The event will not be submitted.'; // Optimization for minifier.
    const config: Configuration = this._config; // Optimization for minifier.
    const log: ILog = config.log; // Optimization for minifier.

    if (response.success) {
      log.info(`Sent ${events.length} events.`);
      this.removeEvents(events);
      return;
    }

    if (response.serviceUnavailable) {
      // You are currently over your rate limit or the servers are under stress.
      log.error('Server returned service unavailable.');
      this.suspendProcessing();
      return;
    }

    if (response.paymentRequired) {
      // If the organization over the rate limit then discard the event.
      log.info('Too many events have been submitted, please upgrade your plan.');
      this.suspendProcessing(null, true, true);
      return;
    }

    if (response.unableToAuthenticate) {
      // The api key was suspended or could not be authorized.
      log.info(`Unable to authenticate, please check your configuration. ${noSubmission}`);
      this.suspendProcessing(15);
      this.removeEvents(events);
      return;
    }

    if (response.notFound || response.badRequest) {
      // The service end point could not be found.
      log.error(`Error while trying to submit data: ${response.message}`);
      this.suspendProcessing(60 * 4);
      this.removeEvents(events);
      return;
    }

    if (response.requestEntityTooLarge) {
      const message = 'Event submission discarded for being too large.';
      if (config.submissionBatchSize > 1) {
        log.error(`${message} Retrying with smaller batch size.`);
        config.submissionBatchSize = Math.max(1, Math.round(config.submissionBatchSize / 1.5));
      } else {
        log.error(`${message} ${noSubmission}`);
        this.removeEvents(events);
      }

      return;
    }

    if (!response.success) {
      log.error(`Error submitting events: ${response.message || 'Please check the network tab for more info.'}`);
      this.suspendProcessing();
    }
  }

  private removeEvents(events: IStorageItem[]) {
    for (let index = 0; index < (events || []).length; index++) {
      this._config.storage.queue.remove(events[index].timestamp);
    }
  }
}
