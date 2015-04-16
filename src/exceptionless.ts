/// <reference path="typings/tsd.d.ts" />

// TODO: We'll need a poly fill for promises.
module Exceptionless {
  export class ExceptionlessClient {
    public config:Configuration;

    constructor(apiKey:string, serverUrl?:string) {
      this.config = new Configuration(apiKey, serverUrl);
    }

    createException(exception:Error): EventBuilder {
      var pluginContextData = new ContextData();
      pluginContextData.setException(exception);
      return this.createEvent(pluginContextData).setType('error');
    }

    submitException(exception:Error): void {
      this.createException(exception).submit();
    }

    submitUnhandledException(exception:Error): void {
      var builder = this.createException(exception);
      builder.pluginContextData.markAsUnhandledError();
      builder.submit();
    }

    createFeatureUsage(feature:string): EventBuilder {
      return this.createEvent().setType('usage').setSource(feature);
    }

    submitFeatureUsage(feature:string): void {
      this.createFeatureUsage(feature).submit();
    }

    // createLog(source:string, message:string, level?:string): EventBuilder
    createLog(...source_message_level:string[]): EventBuilder {
      var builder = this.createEvent().setType('log');

      switch(source_message_level ? source_message_level.length : 0) {
        case 1:
          var source = (<any>(arguments.callee.caller)).name;
          builder = builder.setSource(source).setMessage(source_message_level[0]);
          break;
        case 2:
          builder = builder.setSource(source_message_level[0]).setMessage(source_message_level[1]);
        case 3:
          builder = builder.setSource(source_message_level[0]).setMessage(source_message_level[1]).setProperty('@level', source_message_level[2]);
          break;
      }

      return builder;
    }

    // submitLog(source:string, message:string, level?:string): void
    submitLog(...source_message_level:string[]): void {
      this.createLog(...source_message_level).submit();
    }

    createNotFound(resource:string): EventBuilder {
      return this.createEvent().setType('404').setSource(resource);
    }

    submitNotFound(resource:string): void {
      this.createNotFound(resource).submit();
    }

    createSessionStart(sessionId:string): EventBuilder {
      return this.createEvent().setType('start').setSessionId(sessionId);
    }

    submitSessionStart(sessionId:string): void {
      this.createSessionStart(sessionId).submit();
    }

    createSessionEnd(sessionId:string): EventBuilder {
      return this.createEvent().setType('end').setSessionId(sessionId);
    }

    submitSessionEnd(sessionId:string): void {
      this.createSessionEnd(sessionId).submit();
    }

    createEvent(pluginContextData?:ContextData): EventBuilder {
      return new EventBuilder({ date: new Date() }, this, pluginContextData);
    }

    submitEvent(event:IEvent, pluginContextData?:ContextData) {
      if (!this.config.enabled) {
        this.config.log.info('Event submission is currently disabled');
        return;
      }

      this.config.queue.enqueue(event);
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
      this.serverUrl = serverUrl || 'https://collector.exceptionless.io';
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
      if (console && console.log) {
        console.log('[INFO] Exceptionless:' + message)
      }
    }

    public warn(message) {
      if (console && console.log) {
        console.log('[Warn] Exceptionless:' + message)
      }
    }

    public error(message) {
      if (console && console.log) {
        console.log('[Error] Exceptionless:' + message)
      }
    }
  }

  export interface IEventQueue {
    enqueue(event:IEvent);
    process();
    suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean);
  }

  export class EventQueue implements IEventQueue {
    private _config:Configuration;
    private _areQueuedItemsDiscarded = false;
    private _suspendProcessingUntil:Date;
    private _discardQueuedItemsUntil:Date;
    private _processingQueue = false;
    private _queueTimer = setInterval(() => this.onProcessQueue(), 10000);

    constructor(config:Configuration) {
      this._config = config;
    }

    public enqueue(event:IEvent) {
      if (this.areQueuedItemsDiscarded()) {
        this._config.log.info('Queue items are currently being discarded. The event will not be queued.');
        return;
      }

      var key = this.queuePath() + '-' + new Date().toJSON() + '-' + Math.floor(Math.random() * 9007199254740992);
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
        if (events.length == 0) {
          this._config.log.info('There are currently no queued events to process.');
          return;
        }

        this._config.submissionClient.submit(events, this._config)
          .then(
            (response:SubmissionResponse) => {
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
          this._config.log.info('Finished processing queue.');
          this._processingQueue = false;
        });
      } catch (ex) {
        this._config.log.error('An error occurred while processing the queue: ' + ex);
        this.suspendProcessing();
      } finally {
        this._config.log.info('Finished processing queue.');
        this._processingQueue = false;
      }
    }

    private onProcessQueue() {
      return false;

      if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
        this.process();
      }
    }

    public suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean) {
      if (!durationInMinutes || durationInMinutes <= 0) {
        durationInMinutes = 5;
      }

      this._config.log.info('Suspending processing for ' + durationInMinutes + 'minutes.');
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

    private requeueEvents(events:IEvent[]) {
      for (var event in events || []) {
        this.enqueue(event);
      }
    }

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
    submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse>;
    submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse>;
    getSettings(config:Configuration): Promise<SettingsResponse>;
  }

  export class SubmissionClient implements ISubmissionClient {
    public submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse> {
      var url = config.serverUrl + '/api/v2/events?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('POST', url, JSON.stringify(events)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

    public submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse> {
      var url = config.serverUrl + '/api/v2/events/by-ref/' + encodeURIComponent(referenceId) + '/user-description?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('POST', url, JSON.stringify(description)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

    public getSettings(config:Configuration): Promise<SettingsResponse> {
      var url = config.serverUrl + '/api/v2/projects/config?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('GET', url).then(
          xhr => {
            if (xhr.status !== 200) {
              return new SettingsResponse(false, null, -1, null, 'Unable to retrieve configuration settings: ' + this.getResponseMessage(xhr));
            }

            var settings;
            try {
              settings = JSON.parse(xhr.responseText);
            } catch (e) {
              config.log.error('An error occurred while parsing the settings response text: "' + xhr.responseText + '"');
            }

            if (!settings || !settings.settings || !settings.version) {
              return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
            }

            return new SettingsResponse(true, settings.settings, settings.version);
        },
        xhr => {
          return new SettingsResponse(false, null, -1, null, this.getResponseMessage(xhr));
        }
      );
    }

    private getResponseMessage(xhr:XMLHttpRequest): string {
      if (!xhr || (xhr.status >= 200 && xhr.status <= 299)) {
        return null;
      }

      if (xhr.status === 0) {
        return 'Unable to connect to server.';
      }

      if (xhr.responseBody) {
        return xhr.responseBody.message;
      }

      if (xhr.responseText) {
        try {
          return JSON.parse(xhr.responseText).message;
        } catch (e) {
          return xhr.responseText;
        }
      }

      return  xhr.statusText;
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
        if (method === 'POST' && xhr.setRequestHeader) {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }

        xhr.timeout = 10000;
      }

      return xhr;
    }

    private sendRequest(method:string, url:string, data?:string): Promise<any> {
      var xhr = this.createRequest(method || 'POST', url);

      return new Promise((resolve, reject) => {
        if (!xhr) {
          return reject({ status: 503, message: 'CORS not supported.' });
        }

        if ('withCredentials' in xhr) {
          xhr.onreadystatechange = () => {
            // xhr not ready.
            if (xhr.readyState !== 4) {
              return;
            }

            if (xhr.status >= 200 && xhr.status <= 299) {
              resolve(xhr);
            } else {
              reject(xhr);
            }
          };
        }

        xhr.ontimeout = () => reject(xhr);
        xhr.onerror = () => reject(xhr);
        xhr.onload = () => resolve(xhr);

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
    count(searchPattern?:string): number;
  }

  export class InMemoryStorage<T> implements IStorage<T> {
    private _items = {};

    public save<T>(path:string, value:T): boolean {
      this._items[path] = value;
      return true;
    }

    public get(searchPattern?:string, limit?:number): T[] {
      var results = [];
      var regex = new RegExp(searchPattern || '.*');

      for (var key in this._items) {
        if (results.length >= limit) {
          break;
        }

        if (regex.test(key)) {
          results.push(this._items[key]);
          delete this._items[key];
        }
      }

      return results;
    }

    public clear(searchPattern?:string) {
      if (!searchPattern) {
        this._items = {};
        return;
      }

      var regex = new RegExp(searchPattern);
      for (var key in this._items) {
        if (regex.test(key)) {
          delete this._items[key];
        }
      }
    }

    public count(searchPattern?:string): number {
      var regex = new RegExp(searchPattern || '.*');
      var results = [];
      for (var key in this._items) {
        if (regex.test(key)) {
          results.push(key);
        }
      }

      return results.length;
    }
  }

  export interface IEvent {
    type?: string;
    source?: string;
    date?: Date;
    tags?: string[];
    message?: string;
    geo?: string;
    value?: number;
    data?: any;
    reference_id?: string;
    session_id?: string;
  }

  export class EventBuilder {
    target: IEvent;
    client: ExceptionlessClient;
    pluginContextData: ContextData;

    constructor(event:IEvent, client:ExceptionlessClient, pluginContextData?:ContextData) {
      this.target = event;
      this.client = client;
      this.pluginContextData = pluginContextData;
    }

    public setType(type:string): EventBuilder {
      this.target.type = type;
      return this;
    }

    public setSource(source:string): EventBuilder {
      this.target.source = source;
      return this;
    }

    public setSessionId(sessionId:string): EventBuilder {
      if (!this.isValidIdentifier(sessionId)) {
        throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
      }

      this.target.session_id = sessionId;
      return this;
    }

    public setReferenceId(referenceId:string): EventBuilder {
      if (!this.isValidIdentifier(referenceId)) {
        throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
      }

      this.target.reference_id = referenceId;
      return this;
    }

    public setMessage(message:string): EventBuilder {
      this.target.message = message;
      return this;
    }

    public setGeo(latitude: number, longitude: number): EventBuilder {
      if (latitude < -90.0 || latitude > 90.0)
        throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
      if (longitude < -180.0 || longitude > 180.0)
        throw new Error('Must be a valid longitude value between -180.0 and 180.0.');

      this.target.geo = latitude + ',' + longitude;
      return this;
    }

    public setValue(value:number): EventBuilder {
      this.target.value = value;
      return this;
    }

    public addTags(...tags:string[]): EventBuilder {
      if (tags == null || tags.length === 0) {
        return this;
      }

      if (!this.target.tags) {
        this.target.tags = [];
      }

      for(var tag in tags) {
        if (tag && this.target.tags.indexOf(tag) < 0) {
          this.target.tags.push(tag);
        }
      }

      return this;
    }

    public setProperty(name:string, value:any): EventBuilder {
      if (!this.target.data) {
        this.target.data = {};
      }

      this.target.data[name] = value;
      return this;
    }

    public markAsCritical(critical:boolean): EventBuilder {
      if (critical) {
        this.addTags('Critical');
      }

      return this;
    }

    public submit(): void {
      this.client.submitEvent(this.target, this.pluginContextData);
    }

    private isValidIdentifier(value:string): boolean {
      if (value == null) {
        return true;
      }

      if (value.length < 8 || value.length > 100) {
        return false;
      }

      for (var index = 0; index < value.length; index++) {
        var code = value.charCodeAt(index);
        var isDigit = (code >= 48) && (code <= 57);
        var isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
        var isMinus = code === 45;

        if (!(isDigit || isLetter) && !isMinus) {
          return false;
        }
      }

      return true;
    }
  }

  export class ContextData {
    public setException(exception:Error): void {
      this['@@_Exception'] = exception;
    }

    public hasException(): boolean {
      return !!this['@@_Exception']
    }

    public getException(): Error {
      if (!this.hasException()) {
        return null;
      }

      return this['@@_Exception'];
    }

    /// <summary>
    /// Marks the event as being a unhandled error occurrence.
    /// </summary>
    public markAsUnhandledError(): void {
      this['@@_IsUnhandledError'] = true;
    }

    /// <summary>
    /// Returns true if the event was an unhandled error.
    /// </summary>
    public isUnhandledError(): boolean {
      return !!this['@@_IsUnhandledError'];
    }

    /// <summary>
    /// Sets the submission method that created the event (E.G., UnobservedTaskException)
    /// </summary>
    public setSubmissionMethod(method:string): void {
      this['@@_SubmissionMethod'] = method;
    }

    public getSubmissionMethod(): string {
      if (!!this['@@_SubmissionMethod']) {
        return null;
      }

      return this['@@_SubmissionMethod'];
    }
  }

  export interface IUserDescription {
    email_address?: string;
    description?: string;
    data?: any;
  }
}
