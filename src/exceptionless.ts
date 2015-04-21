/// <reference path="typings/tsd.d.ts" />
/// <reference path="stacktrace.d.ts" />

// TODO: We'll need a poly fill for promises.
// TODO: Verify that stack traces are parsed properly.
// TODO: Handle Server Settings
// TODO: Lock configuration.
// TODO: Look into using templated strings `${1 + 1}`.

module Exceptionless {
  export class ExceptionlessClient {
    public config:Configuration;

    constructor(apiKey?:string, serverUrl?:string) {
      var settings = this.getSettingsFromScriptTag() || {};
      this.config = new Configuration(apiKey || settings.apiKey, serverUrl || settings.serverUrl);
    }

    public createException(exception:Error): EventBuilder {
      var pluginContextData = new ContextData();
      pluginContextData.setException(exception);
      return this.createEvent(pluginContextData).setType('error');
    }

    public submitException(exception:Error): Promise<any> {
      return this.createException(exception).submit();
    }

    public createUnhandledException(exception:Error): EventBuilder {
      var builder = this.createException(exception);
      builder.pluginContextData.markAsUnhandledError();

      return builder;
    }

    public submitUnhandledException(exception:Error): Promise<any> {
      return this.createUnhandledException(exception).submit();
    }

    public createFeatureUsage(feature:string): EventBuilder {
      return this.createEvent().setType('usage').setSource(feature);
    }

    public submitFeatureUsage(feature:string): Promise<any> {
      return this.createFeatureUsage(feature).submit();
    }

    public createLog(message:string): EventBuilder;
    public createLog(source:string, message:string): EventBuilder;
    public createLog(source:string, message:string, level:string): EventBuilder;
    public createLog(sourceOrMessage:string, message?:string, level?:string): EventBuilder {
      var builder = this.createEvent().setType('log');

      if (sourceOrMessage && message && level) {
        builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
      } else if (sourceOrMessage && message) {
        builder = builder.setSource(sourceOrMessage).setMessage(message);
      } else {
        // TODO: Look into using https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
        var source = (<any>(arguments.callee.caller)).name;
        builder = builder.setSource(source).setMessage(sourceOrMessage);
      }

      return builder;
    }

    public submitLog(message:string): Promise<any>;
    public submitLog(source:string, message:string): Promise<any>;
    public submitLog(source:string, message:string, level:string): Promise<any>;
    public submitLog(sourceOrMessage:string, message?:string, level?:string): Promise<any> {
      return this.createLog(sourceOrMessage, message, level).submit();
    }

    public createNotFound(resource:string): EventBuilder {
      return this.createEvent().setType('404').setSource(resource);
    }

    public submitNotFound(resource:string): Promise<any> {
      return this.createNotFound(resource).submit();
    }

    public createSessionStart(sessionId:string): EventBuilder {
      return this.createEvent().setType('start').setSessionId(sessionId);
    }

    public submitSessionStart(sessionId:string): Promise<any> {
      return this.createSessionStart(sessionId).submit();
    }

    public createSessionEnd(sessionId:string): EventBuilder {
      return this.createEvent().setType('end').setSessionId(sessionId);
    }

    public submitSessionEnd(sessionId:string): Promise<any> {
      return this.createSessionEnd(sessionId).submit();
    }

    public createEvent(pluginContextData?:ContextData): EventBuilder {
      return new EventBuilder({ date: new Date() }, this, pluginContextData);
    }

    public submitEvent(event:IEvent, pluginContextData?:ContextData): Promise<any> {
      if (!event) {
        return Promise.reject(new Error('Unable to submit undefined event.'));
      }

      if (!this.config.enabled) {
        var message:string = 'Event submission is currently disabled.';
        this.config.log.info(message);
        return Promise.reject(new Error(message));
      }

      var context = new EventPluginContext(this, event, pluginContextData);
      return EventPluginManager.run(context)
        .then(() => {
          if (context.cancel) {
            var message:string = 'Event submission cancelled by plugin": id=' + event.reference_id + ' type=' + event.type;
            this.config.log.info(message);
            return Promise.reject(new Error(message));
          }

          // ensure all required data
          if (!event.type || event.type.length === 0) {
            event.type = 'log';
          }

          if (!event.date) {
            event.date = new Date();
          }

          this.config.log.info('Submitting event: type=' + event.type + !!event.reference_id ? ' refid=' + event.reference_id : '');
          this.config.queue.enqueue(event);

          if (event.reference_id && event.reference_id.length > 0) {
            this.config.log.info('Setting last reference id "' + event.reference_id + '"');
            this.config.lastReferenceIdManager.setLast(event.reference_id);
          }

          return Promise.resolve();
        })
        .catch((error:Error) => {
          var message:string = 'Event submission cancelled. An error occurred while running the plugins: ' + error && error.message ? error.message : <any>error;
          this.config.log.error(message);
          return Promise.reject(new Error(message));
        });
    }

    public getLastReferenceId(): string {
      return this.config.lastReferenceIdManager.getLast();
    }

    public register(): void {
      var oldOnErrorHandler:any = window.onerror;
      (<any>window).onerror = (message:string, filename:string, lineno:number, colno:number, error:Error) => {
        if(error !== null) {
          this.submitUnhandledException(error);
        } else {
          // Only message, filename and lineno work here.
          var e:IError = { message: message, stack_trace: [{ file_name: filename, line_number: lineno, column: colno }]};
          this.createUnhandledException(new Error(message)).setMessage(message).setProperty('@error', e).submit();
        }

        if (oldOnErrorHandler) {
          try {
            return oldOnErrorHandler(message, filename, lineno, colno, error);
          } catch(e) {
            this.config.log.error('An error occurred while calling previous error handler: ' + e.message);
          }
        }

        return false;
      }
    }

    private getSettingsFromScriptTag(): any {
      var scripts = document.getElementsByTagName('script');

      for (var index = 0; index < scripts.length; index++) {
        if (scripts[index].src && scripts[index].src.indexOf('/exceptionless') > -1) {
          return Utils.parseQueryString(scripts[index].src.split('?').pop());
        }
      }

      return null;
    }

    private static _instance:ExceptionlessClient = null;
    public static get default() {
      if(ExceptionlessClient._instance === null) {
        ExceptionlessClient._instance = new ExceptionlessClient(null);
      }
      return ExceptionlessClient._instance;
    }
  }

  export class Configuration {
    private _apiKey:string;
    private _enabled:boolean = false;
    private _serverUrl:string = 'https://collector.exceptionless.io';
    private _plugins:IEventPlugin[] = [];

    public lastReferenceIdManager:ILastReferenceIdManager = new InMemoryLastReferenceIdManager();
    public log:ILog = new NullLog();
    public submissionBatchSize = 50;
    public submissionClient:ISubmissionClient = new SubmissionClient();
    public storage:IStorage<any> = new InMemoryStorage<any>();
    public queue:IEventQueue;
    public defaultTags:string[] = [];
    public defaultData:Object = {};

    constructor(apiKey:string, serverUrl?:string) {
      this.apiKey = apiKey;
      this.serverUrl = serverUrl;
      this.queue = new EventQueue(this);

      EventPluginManager.addDefaultPlugins(this);
    }

    public get apiKey(): string {
      return this._apiKey;
    }

    public set apiKey(value:string) {
      this._apiKey = value;
      this._enabled = !!value && value.length > 0;
    }

    public get serverUrl(): string {
      return this._serverUrl;
    }

    public set serverUrl(value:string) {
      if (!!value && value.length > 0) {
        this._serverUrl = value;
      }
    }

    public get enabled(): boolean {
      return this._enabled;
    }

    public get plugins(): IEventPlugin[] {
      return this._plugins.sort((p1:IEventPlugin, p2:IEventPlugin) => {
        return (p1.priority < p2.priority) ? -1 : (p1.priority > p2.priority) ? 1 : 0;
      });
    }

    public addPlugin(plugin:IEventPlugin): void;
    public addPlugin(name:string, priority:number, pluginAction:(context:EventPluginContext) => void): void;
    public addPlugin(pluginOrName:IEventPlugin|string, priority?:number, pluginAction?:(context:EventPluginContext) => Promise<any>): void {
      var plugin:IEventPlugin = !!pluginAction ? { name: <string>pluginOrName, priority: priority, run: pluginAction } : <IEventPlugin>pluginOrName;
      if (!plugin || !plugin.run) {
        this.log.error('Unable to add plugin: No run method was found.');
        return;
      }

      if (!plugin.name) {
        plugin.name = Utils.guid();
      }

      if (!plugin.priority) {
        plugin.priority = 0;
      }

      var pluginExists:boolean = false;
      for(var index = 0; index < this._plugins.length; index++) {
        if (this._plugins[index].name === plugin.name) {
          pluginExists = true;
          break;
        }
      }

      if (!pluginExists) {
        this._plugins.push(plugin);
      }
    }

    public removePlugin(plugin:IEventPlugin): void;
    public removePlugin(name:string): void;
    public removePlugin(pluginOrName:IEventPlugin|string): void {
      var name:string = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
      if (!name) {
        this.log.error('Unable to remove plugin: No plugin name was specified.');
        return;
      }

      for(var index = 0; index < this._plugins.length; index++) {
        if (this._plugins[index].name === name) {
          this._plugins.splice(index, 1);
          break;
        }
      }
    }

    public useReferenceIds(): void {
      this.addPlugin(new ReferenceIdPlugin());
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
    private _suspendProcessingUntil:Date;
    private _discardQueuedItemsUntil:Date;
    private _processingQueue:boolean = false;
    private _queueTimer:number;

    constructor(config:Configuration) {
      this._config = config;
    }

    public enqueue(event:IEvent) {
      this.ensureQueueTimer();

      if (this.areQueuedItemsDiscarded()) {
        this._config.log.info('Queue items are currently being discarded. The event will not be queued.');
        return;
      }

      var key = this.queuePath() + '-' + new Date().toJSON() + '-' + Utils.randomNumber();
      this._config.log.info('Enqueuing event: ' + key);
      return this._config.storage.save(key, event);
    }

    public process() {
      this.ensureQueueTimer();

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
        if (!events || events.length == 0) {
          this._config.log.info('There are currently no queued events to process.');
          return;
        }

        this._config.log.info('Sending ' + events.length + ' events to ' + this._config.serverUrl + '.');
        this._config.submissionClient.submit(events, this._config)
          .then(
            (response:SubmissionResponse) => this.processSubmissionResponse(response, events),
            (response:SubmissionResponse) => this.processSubmissionResponse(response, events))
          .then(() => {
            this._config.log.info('Finished processing queue.');
            this._processingQueue = false;
          });
      } catch (ex) {
        this._config.log.error('An error occurred while processing the queue: ' + ex);
        this.suspendProcessing();
        this._processingQueue = false;
      }
    }

    private processSubmissionResponse(response:SubmissionResponse, events:IEvent[]){
      if (response.success) {
        this._config.log.info('Sent ' + events.length + ' events to ' + this._config.serverUrl + '.');
        return;
      }

      if (response.serviceUnavailable) {
        // You are currently over your rate limit or the servers are under stress.
        this._config.log.error('Server returned service unavailable.');
        this.suspendProcessing();
        this.requeueEvents(events);
        return;
      }

      if (response.paymentRequired) {
        // If the organization over the rate limit then discard the event.
        this._config.log.info('Too many events have been submitted, please upgrade your plan.');
        this.suspendProcessing(null, true, true);
        return;
      }

      if (response.unableToAuthenticate) {
        // The api key was suspended or could not be authorized.
        this._config.log.info('Unable to authenticate, please check your configuration. The event will not be submitted.');
        this.suspendProcessing(15);
        return;
      }

      if (response.notFound || response.badRequest) {
        // The service end point could not be found.
        this._config.log.error('Error while trying to submit data: ' + response.message);
        this.suspendProcessing(60 * 4);
        return;
      }

      if (response.requestEntityTooLarge) {
        if (this._config.submissionBatchSize > 1) {
          this._config.log.error('Event submission discarded for being too large. The event will be retried with a smaller events size.');
          this._config.submissionBatchSize = Math.max(1, Math.round(this._config.submissionBatchSize / 1.5));
          this.requeueEvents(events);
        } else {
          this._config.log.error('Event submission discarded for being too large. The event will not be submitted.');
        }

        return;
      }

      if (!response.success) {
        this._config.log.error('An error occurred while submitting events: ' + response.message);
        this.suspendProcessing();
        this.requeueEvents(events);
      }
    }

    private ensureQueueTimer() : void {
      if (!this._queueTimer) {
        this._queueTimer = setInterval(() => this.onProcessQueue(), 10000);
      }
    }

    private onProcessQueue(): void {
      if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
        this.process();
      }
    }

    public suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean): void {
      if (!durationInMinutes || durationInMinutes <= 0) {
        durationInMinutes = 5;
      }

      this._config.log.info('Suspending processing for ' + durationInMinutes + ' minutes.');
      this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));

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

    private requeueEvents(events:IEvent[]): void {
      this._config.log.info('Requeuing ' + events.length + ' events.');

      for (var index = 0; index < events.length; index++) {
        this.enqueue(events[index]);
      }
    }

    private isQueueProcessingSuspended(): boolean {
      return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    }

    private areQueuedItemsDiscarded(): boolean {
      return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    }

    private queuePath(): string {
      return !!this._config.apiKey ? 'ex-' + this._config.apiKey.slice(0, 8) + '-q' : null;
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
    success:boolean = false;
    badRequest:boolean = false;
    serviceUnavailable:boolean = false;
    paymentRequired:boolean = false;
    unableToAuthenticate:boolean = false;
    notFound:boolean = false;
    requestEntityTooLarge:boolean = false;
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
    success:boolean = false;
    settings:any;
    settingsVersion:number = -1;
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

  export interface ILastReferenceIdManager {
    getLast(): string;
    clearLast(): void;
    setLast(eventId:string): void;
  }

  export class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
    private _lastReferenceId:string = null;

    getLast(): string {
      return this._lastReferenceId;
    }

    clearLast():void {
      this._lastReferenceId = null;
    }

    setLast(eventId:string):void {
      this._lastReferenceId = eventId;
    }
  }

  export interface IEvent {
    type?:string;
    source?:string;
    date?:Date;
    tags?:string[];
    message?:string;
    geo?:string;
    value?:number;
    data?:any;
    reference_id?:string;
    session_id?:string;
  }

  export class EventBuilder {
    public target:IEvent;
    public client:ExceptionlessClient;
    public pluginContextData:ContextData;

    constructor(event:IEvent, client:ExceptionlessClient, pluginContextData?:ContextData) {
      this.target = event;
      this.client = client;
      this.pluginContextData = pluginContextData;
    }

    public setType(type:string): EventBuilder {
      if (!!type && type.length > 0) {
        this.target.type = type;
      }

      return this;
    }

    public setSource(source:string): EventBuilder {
      if (!!source && source.length > 0) {
        this.target.source = source;
      }

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
      if (!!message && message.length > 0) {
        this.target.message = message;
      }

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
      if (!!value) {
        this.target.value = value;
      }

      return this;
    }

    public addTags(...tags:string[]): EventBuilder {
      if (!tags || tags.length === 0) {
        return this;
      }

      if (!this.target.tags) {
        this.target.tags = [];
      }

      for (var index = 0; index < tags.length; index++) {
        if (tags[index] && this.target.tags.indexOf(tags[index]) < 0) {
          this.target.tags.push(tags[index]);
        }
      }

      return this;
    }

    public setProperty(name:string, value:any): EventBuilder {
      if (!name || (value === undefined || value == null)) {
        return this;
      }

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

    public submit(): Promise<any> {
      return this.client.submitEvent(this.target, this.pluginContextData);
    }

    private isValidIdentifier(value:string): boolean {
      if (!value || !value.length) {
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

    public get hasException(): boolean {
      return !!this['@@_Exception']
    }

    public getException(): Error {
      if (!this.hasException) {
        return null;
      }

      return this['@@_Exception'];
    }

    public markAsUnhandledError(): void {
      this['@@_IsUnhandledError'] = true;
    }

    public get isUnhandledError(): boolean {
      return !!this['@@_IsUnhandledError'];
    }

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

  export class EventPluginContext {
    public client:ExceptionlessClient;
    public event:IEvent;
    public contextData:ContextData;
    public cancel:boolean = false;

    constructor(client:ExceptionlessClient, event:IEvent, contextData?:ContextData) {
      this.client = client;
      this.event = event;
      this.contextData = contextData ? contextData : new ContextData();
    }

    public get log(): ILog {
      return this.client.config.log;
    }
  }

  export interface IEventPlugin {
    priority?:number;
    name?:string;
    run(context:EventPluginContext): Promise<any>;
  }

  class EventPluginManager {
    public static run(context:EventPluginContext): Promise<any> {
      return context.client.config.plugins.reduce((promise:Promise<any>, plugin:IEventPlugin) => {
        return promise.then(() => {
          return plugin.run(context);
        });
      }, Promise.resolve());
    }

    public static addDefaultPlugins(config:Configuration): void {
      config.addPlugin(new ConfigurationDefaultsPlugin());
      config.addPlugin(new ErrorPlugin());
      config.addPlugin(new DuplicateCheckerPlugin());
      config.addPlugin(new ModuleInfoPlugin());
      config.addPlugin(new RequestInfoPlugin());
      config.addPlugin(new SubmissionMethodPlugin());
    }
  }

  class ConfigurationDefaultsPlugin implements IEventPlugin {
    public priority:number = 10;
    public name:string = 'ConfigurationDefaultsPlugin';

    run(context:Exceptionless.EventPluginContext): Promise<any> {
      if (!!context.client.config.defaultTags) {
        if (!context.event.tags) {
          context.event.tags = [];
        }

        for (var index = 0; index < context.client.config.defaultTags.length; index++) {
          var tag = context.client.config.defaultTags[index];
          if (tag && context.client.config.defaultTags.indexOf(tag) < 0) {
            context.event.tags.push(tag)
          }
        }
      }

      if (!!context.client.config.defaultData) {
        if (!context.event.data) {
          context.event.data = {};
        }

        for (var key in context.client.config.defaultData) {
          if (!!context.client.config.defaultData[key]) {
            context.event.data[key] = context.client.config.defaultData[key];
          }
        }
      }

      return Promise.resolve();
    }
  }

  class ReferenceIdPlugin implements IEventPlugin {
    public priority:number = 20;
    public name:string = 'ReferenceIdPlugin';

    run(context:Exceptionless.EventPluginContext): Promise<any> {
      if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
        context.event.reference_id = Utils.guid().replace('-', '').substring(0, 10);
      }

      return Promise.resolve();
    }
  }

  class ErrorPlugin implements IEventPlugin {
    public priority:number = 30;
    public name:string = 'ErrorPlugin';

    run(context:Exceptionless.EventPluginContext): Promise<any> {
      var exception = context.contextData.getException();
      if (exception == null) {
        return Promise.resolve();
      }

      if (!context.event.data) {
        context.event.data = {};
      }

      context.event.type = 'error';
      if (!!context.event.data['@error']) {
        return Promise.resolve();
      }

      return StackTrace.fromError(exception).then(
        (stackFrames: StackTrace.StackFrame[]) => this.processError(context, exception, stackFrames),
        () => this.onParseError(context)
      );
    }

    private processError(context:Exceptionless.EventPluginContext, exception:Error, stackFrames: StackTrace.StackFrame[]): Promise<any> {
      var error:IError = {
        message: exception.message,
        stack_trace: this.getStackFrames(context, stackFrames || []),
      };

      context.event.data['@error'] = error;

      return Promise.resolve();
    }

    private onParseError(context:Exceptionless.EventPluginContext): Promise<any>  {
      context.cancel = true;
      return Promise.reject(new Error('Unable to parse the exceptions stack trace. This exception will be discarded.'))
    }

    private getStackFrames(context:Exceptionless.EventPluginContext, stackFrames:StackTrace.StackFrame[]): IStackFrame[] {
      var frames:IStackFrame[] = [];

      for (var index = 0; index < stackFrames.length; index++) {
        frames.push({
          name: stackFrames[index].functionName,
          //parameters: stackFrames[index].args, // TODO: need to verify arguments.
          file_name: stackFrames[index].fileName,
          line_number: stackFrames[index].lineNumber,
          column: stackFrames[index].columnNumber
        });
      }

      return frames;
    }
  }

  class ModuleInfoPlugin implements IEventPlugin {
    public priority:number = 40;
    public name:string = 'ModuleInfoPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      console.log(context);
      if (!context.event.data || !context.event.data['@error'] || !!context.event.data['@error'].modules) {
        return Promise.resolve();
      }

      try {
        var modules:IModule[] = [];
        var scripts = document.getElementsByTagName('script');
        if (scripts && scripts.length > 0) {
          for (var index = 0; index < scripts.length; index++) {
            if (scripts[index].src) {
              modules.push({ module_id: index, name: scripts[index].src, version: Utils.parseVersion(scripts[index].src) });
            } else if (!!scripts[index].innerHTML) {
              modules.push({ module_id: index, name: 'Script Tag', version: Utils.getHashCode(scripts[index].innerHTML) });
            }
          }

          context.event.data['@error'].modules = modules;
        }
      } catch (e) {
        context.log.error('Unable to get module info. Exception: ' + e.message);
      }

      return Promise.resolve();
    }
  }

  class DuplicateCheckerPlugin implements IEventPlugin {
    public priority:number = 50;
    public name:string = 'DuplicateCheckerPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      // TODO: Implement
      return Promise.resolve();
    }
  }

  class RequestInfoPlugin implements IEventPlugin {
    public priority:number = 60;
    public name:string = 'RequestInfoPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      if (!!context.event.data && !!context.event.data['@request']) {
        return Promise.resolve();
      }

      if (!context.event.data) {
        context.event.data = {};
      }

      var requestInfo:IRequestInfo = {
        user_agent: navigator.userAgent,
        is_secure: location.protocol === 'https:',
        host: location.hostname,
        port: location.port && location.port !== '' ? parseInt(location.port) : 80,
        path: location.pathname,
        //client_ip_address: 'TODO',
        cookies: this.getCookies(),
        query_string: Utils.parseQueryString(location.search.substring(1)),
      };

      if (document.referrer && document.referrer !== '') {
        requestInfo.referrer = document.referrer;
      }

      context.event.data['@request'] = requestInfo;
      return Promise.resolve();
    }

    private getCookies(): any {
      if (!document.cookie) {
        return null;
      }

      var result = {};

      var cookies = document.cookie.split(', ');
      for (var index = 0; index < cookies.length; index++) {
        var cookie = cookies[index].split('=');
        result[cookie[0]] = cookie[1];
      }

      return result;
    }
  }

  class SubmissionMethodPlugin implements IEventPlugin {
    public priority:number = 100;
    public name:string = 'SubmissionMethodPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      var submissionMethod:string = context.contextData.getSubmissionMethod();
      if (!!submissionMethod) {
        if (!context.event.data) {
          context.event.data = {};
        }

        context.event.data['@submission_method'] = submissionMethod;
      }

      return Promise.resolve();
    }
  }

  interface IParameter {
    data?:any;
    generic_arguments?:string[];

    name?:string;
    type?:string;
    type_namespace?:string;
  }

  interface IMethod {
    data?:any;
    generic_arguments?:string[];
    parameters?:IParameter[];

    is_signature_target?:boolean;
    declaring_namespace?:string;
    declaring_type?:string;
    name?:string;
    module_id?:number;
  }

  interface IStackFrame extends IMethod {
    file_name:string;
    line_number:number;
    column:number;
  }

  interface IModule {
    data?:any;

    module_id?:number;
    name?:string;
    version?:string;
    is_entry?:boolean;
    created_date?:Date;
    modified_date?:Date;
  }

  interface IInnerError {
    message?:string;
    type?:string;
    code?:string;
    data?:any;
    inner?:IInnerError
    stack_trace?:IStackFrame[];
    target_method?:IMethod;
  }

  interface IError extends IInnerError {
    modules?:IModule[]
  }

  interface IRequestInfo {
    user_agent?:string;
    http_method?:string;
    is_secure?:boolean;
    host?:string;
    port?:number;
    path?:string;
    referrer?:string;
    client_ip_address?:string;
    cookies?:any;
    post_data?:any;
    query_string?:any;
    data?:any
  }

  export interface IUserDescription {
    email_address?:string;
    description?:string;
    data?:any;
  }

  export class Utils {
    public static getHashCode(source:string): string {
      if (!source || source.length === 0) {
        return null;
      }

      var hash:number = 0;
      for (var index = 0; index < source.length; index++) {
        var character   = source.charCodeAt(index);
        hash  = ((hash << 5) - hash) + character;
        hash |= 0;
      }

      return hash.toString();
    }

    public static guid(): string {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }

      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

     public static parseVersion(source:string): string {
      if (!source) {
        return null;
      }

      var versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
      var matches = versionRegex.exec(source);
      if (matches && matches.length > 0) {
        return matches[0];
      }

      return null;
    }

    public static parseQueryString(query:string) {
      if (!query || query.length === 0) {
        return null;
      }

      var pairs = query.split('&');
      if (pairs.length === 0) {
        return null;
      }

      var result = {};
      for (var index = 0; index < pairs.length; index++) {
        var pair = pairs[index].split('=');
        result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }

      return result;
    }

    public static randomNumber(): number {
      return Math.floor(Math.random() * 9007199254740992);
    }
  }
}
