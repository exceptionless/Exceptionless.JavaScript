
// TODO: We'll need a poly fill for promises.
module Exceptionless {
  export class ExceptionlessClient {
    public config:Configuration;

    constructor(apiKey:string, serverUrl?:string) {
      this.config = new Configuration(apiKey, serverUrl);
    }

    submit(events:ExceptionlessEvent) {
      if (!this.config.enabled) {
        this.config.log.info('Event submission is currently disabled');
        return;
      }
    }
  }

  export class Configuration {
    apiKey:string;
    serverUrl:string;
    enabled = true;

    log:ILog = new NullLog();
    submissionBatchSize = 50;
    submissionClient:ISubmissionClient = new SubmissionClient();
    storage:IStorage<any> = new InMemoryStorage<any>();
    queue:IEventQueue;

    constructor(apiKey:string, serverUrl?:string) {
      this.setApiKey(apiKey);
      this.serverUrl = serverUrl || 'https://collector.exceptionless.io/api/v2';
      this.queue = new EventQueue(this);
    }

    public setApiKey(apiKey:string) {
      this.apiKey = apiKey;
      this.enabled = !!apiKey;
    }

    public getQueueName(): string {
      return !!this.apiKey ? 'ex-' + this.apiKey.slice(0, 8) : null;
    }
  }

  export interface ILog {
    info(message:string);
    warn(message:string);
    error(message:string);
  }

  export class NullLog implements ILog {
    public info(message) {}
    public warn(message) {}
    public error(message) {}
  }

  export class ConsoleLog implements ILog {
    public info(message) {
      console.log('[INFO] Exceptionless:' + message)
    }

    public warn(message) {
      console.log('[Warn] Exceptionless:' + message)
    }

    public error(message) {
      console.log('[Error] Exceptionless:' + message)
    }
  }

  export interface IEventQueue {
    enqueue(event:ExceptionlessEvent);
    process();
    suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean);
  }

  export class EventQueue implements IEventQueue {
    private _config:Configuration;
    private _areQueuedItemsDiscarded = false;
    private _suspendProcessingUntil:Date;
    private _discardQueuedItemsUntil:Date;
    private _processingQueue = false;

    // TODO: Queue Timer;

    constructor(config:Configuration) {
      this._config = config;
    }

    public enqueue(event:ExceptionlessEvent) {
      if (this.areQueuedItemsDiscarded()) {
        this._config.log.info('Queue items are currently being discarded. The event will not be queued.');
        return;
      }

      return this._config.storage.save(key, event);
    }

    public process() {
      if (this._processingQueue) {
        return;
      }

      this._config.log.info('Processing queue...');
      if (!this._config.enabled) {
        this._config.log.info('Configuration is disabled. The queue will not be processed.');
        return;
      }

      this._processingQueue = true;

      try {
        var events = this._config.storage.get(this.queuePath(), this._config.submissionBatchSize);
          .then<any>((response:SubmissionResponse) => {
            if (response.success) {
              this._config.log.info('Sent ' + events.length + ' events to "' + this._config.serverUrl + '".');
            } else if (response.serviceUnavailable) {
              // You are currently over your rate limit or the servers are under stress.
              this._config.log.error('Server returned service unavailable.');
              this.suspendProcessing();
              this.requeueEvents(events);
            } else if (response.paymentRequired) {
              // If the organization over the rate limit then discard the event.
              this._config.log.info('Too many events have been submitted, please upgrade your plan.');
              this.suspendProcessing(null, true, true);
            } else if (response.unableToAuthenticate) {
              // The api key was suspended or could not be authorized.
              this._config.log.info('Unable to authenticate, please check your configuration. The event will not be submitted.');
              this.suspendProcessing(15);
            } else if (response.notFound || response.badRequest) {
              // The service end point could not be found.
              this._config.log.error('Error while trying to submit data: ' + response.message);
              this.suspendProcessing(60 * 4);
            } else if (response.requestEntityTooLarge) {
              if (this._config.submissionBatchSize > 1) {
                this._config.log.error('Event submission discarded for being too large. The event will be retried with a smaller events size.');
                this._config.submissionBatchSize = Math.max(1, Math.round(this._config.submissionBatchSize / 1.5));
                this.requeueEvents(events);
              } else {
                this._config.log.error('Event submission discarded for being too large. The event will not be submitted.');
              }
            } else if (!response.success) {
              this._config.log.error('An error occurred while submitting events: ' + response.message);
              this.suspendProcessing();
              this.requeueEvents(events);
            }
          },
          (response:SubmissionResponse) => {
            this._config.log.error('An error occurred while submitting events: ' + response.message);
            this.suspendProcessing();
            this.requeueEvents(events);
          })
        .then(() => {
          this._processingQueue = false;
        });
      } catch (ex) {
        this._config.log.error('An error occurred while processing the queue: ' + ex);
        this.suspendProcessing();
      } finally {
        this._processingQueue = false;
      }
    }

    public suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean) {
      if (!durationInMinutes || durationInMinutes <= 0) {
        durationInMinutes = 5;
      }

      this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
      //_queueTimer.Change(duration.Value, _processQueueInterval);

      if (discardFutureQueuedItems) {
        this._discardQueuedItemsUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
      }

      if (!clearQueue) {
        return;
      }

      // Account is over the limit and we want to ensure that the sample size being sent in will contain newer errors.
      try {
        this._config.storage.clear(this.queuePath());
      } catch (Exception) { }
    }

    private requeueEvents(events:ExceptionlessEvent[]) {
      for (var event in events || []) {
        this.enqueue(event);
      }
    }

    //private void OnProcessQueue(object state) {
    //  if (!IsQueueProcessingSuspended && !_processingQueue)
    //  Process();
    //}

    private isQueueProcessingSuspended(): boolean {
      return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    }

    private areQueuedItemsDiscarded(): boolean {
      return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    }

    private queuePath(): string {
      return this._config.getQueueName() + '-q'
    }
  }

  export interface ISubmissionClient {
    getSettings(config:Configuration): Promise<SettingsResponse>;
  }

  export class SubmissionClient implements ISubmissionClient {
      return this.sendRequest('POST', url, JSON.stringify(events)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

      return this.sendRequest('POST', url, JSON.stringify(description)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

    public getSettings(config:Configuration): Promise<SettingsResponse> {
      return this.sendRequest('GET', url).then(
          xhr => {
          if (xhr.status !== 200) {
          }

          var settings = JSON.parse(xhr.responseText);
          if (!settings.settings || !settings.version) {
            return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
          }

          return new SettingsResponse(true, settings.settings, settings.version);
        },
          xhr => { return new SettingsResponse(false, null, -1, null, this.getResponseMessage(xhr)); }
      );
    }

    private getResponseMessage(xhr:XMLHttpRequest): string {
      if (!xhr || (xhr.status >= 200 && xhr.status <= 299)) {
        return null;
      }

      return  xhr.status == 404 ? "404 Page not found." : xhr.responseBody ? xhr.responseBody.message : '';
    }

    private createRequest(method:string, url:string): XMLHttpRequest {
      var xhr:any = new XMLHttpRequest();
      if ('withCredentials' in xhr) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest != 'undefined') {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }

      if (xhr) {
        xhr.timeout = 10000;
      }

      return xhr;
    }

    private sendRequest(method:string, url:string, data?:string): Promise<any> {
      return new Promise(function(resolve, reject) {
        var xhr = this.createRequest(method || 'POST', url);
        if (!xhr) {
          return reject({ status: 503, message: 'CORS not supported.' });
        }

        if ('withCredentials' in xhr) {
          xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4 && xhr.status === 202) {
              return resolve(xhr);
            }

            reject(xhr);
          };
        }

        xhr.ontimeout = function () {
          reject(xhr);
        };

        xhr.onload = function () {
          return resolve(xhr);
        };

        xhr.onerror = function () {
          reject(xhr);
        };

        xhr.send(data);
      });
    }
  }

  export class SubmissionResponse {
    success = false;
    badRequest = false;
    serviceUnavailable = false;
    paymentRequired = false;
    unableToAuthenticate = false;
    notFound = false;
    requestEntityTooLarge = false;
    statusCode:number;
    message:string;

    constructor(statusCode:number, message?:string) {
      this.statusCode = statusCode;
      this.message = message;

      this.success = statusCode >= 200 && statusCode <= 299;
      this.badRequest = statusCode === 400;
      this.serviceUnavailable = statusCode === 503;
      this.paymentRequired = statusCode === 402;
      this.unableToAuthenticate = statusCode === 401 || statusCode === 403;
      this.notFound = statusCode === 404;
      this.requestEntityTooLarge = statusCode === 413;
    }
  }

  export class SettingsResponse {
    success = false;
    settings:any;
    settingsVersion = -1;
    message:string;
    exception:any;

    constructor(success:boolean, settings:any, settingsVersion:number = -1, exception:any = null, message:string = null) {
      this.success = success;
      this.settings = settings;
      this.settingsVersion = settingsVersion;
      this.exception = exception;
      this.message = message;
    }
  }

  export interface IStorage<T>{
    save<T>(path:string, value:T): boolean;
    get(searchPattern?:string, limit?:number): T[];
    clear(searchPattern?:string);
  }

  export class InMemoryStorage<T> implements IStorage<T> {
    public save<T>(path:string, value:T): boolean {
      return false;
    }

    public get(searchPattern?:string, limit?:number): T[] {
      return [];
    }

    public clear(searchPattern?:string) {

    }
  }

  export class ExceptionlessEvent {}

  export class UserDescription {}
}
