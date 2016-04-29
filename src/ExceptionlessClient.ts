import { IConfigurationSettings } from './configuration/IConfigurationSettings';
import { Configuration } from './configuration/Configuration';
import { EventBuilder } from './EventBuilder';
import { IEvent } from './models/IEvent';
import { IUserDescription } from './models/IUserDescription';
import { EventPluginContext } from './plugins/EventPluginContext';
import { EventPluginManager } from './plugins/EventPluginManager';
import { ContextData } from './plugins/ContextData';
import { SubmissionResponse } from './submission/SubmissionResponse';

export class ExceptionlessClient {
  /**
   * The default ExceptionlessClient instance.
   * @type {ExceptionlessClient}
   * @private
   */
  private static _instance: ExceptionlessClient = null;

  public config: Configuration;

  constructor();
  constructor(settings: IConfigurationSettings);
  constructor(apiKey: string, serverUrl?: string);
  constructor(settingsOrApiKey?: IConfigurationSettings | string, serverUrl?: string) {
    if (typeof settingsOrApiKey === 'object') {
      this.config = new Configuration(settingsOrApiKey);
    } else {
      this.config = new Configuration({ apiKey: <string>settingsOrApiKey, serverUrl: serverUrl });
    }
  }

  public createException(exception: Error): EventBuilder {
    let pluginContextData = new ContextData();
    pluginContextData.setException(exception);
    return this.createEvent(pluginContextData).setType('error');
  }

  public submitException(exception: Error, callback?: (context: EventPluginContext) => void): void {
    this.createException(exception).submit(callback);
  }

  public createUnhandledException(exception: Error, submissionMethod?: string): EventBuilder {
    let builder = this.createException(exception);
    builder.pluginContextData.markAsUnhandledError();
    builder.pluginContextData.setSubmissionMethod(submissionMethod);

    return builder;
  }

  public submitUnhandledException(exception: Error, submissionMethod?: string, callback?: (context: EventPluginContext) => void) {
    this.createUnhandledException(exception, submissionMethod).submit(callback);
  }

  public createFeatureUsage(feature: string): EventBuilder {
    return this.createEvent().setType('usage').setSource(feature);
  }

  public submitFeatureUsage(feature: string, callback?: (context: EventPluginContext) => void): void {
    this.createFeatureUsage(feature).submit(callback);
  }

  public createLog(message: string): EventBuilder;
  public createLog(source: string, message: string): EventBuilder;
  public createLog(source: string, message: string, level: string): EventBuilder;
  public createLog(sourceOrMessage: string, message?: string, level?: string): EventBuilder {
    let builder = this.createEvent().setType('log');

    if (message && level) {
      builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
    } else if (message) {
      builder = builder.setSource(sourceOrMessage).setMessage(message);
    } else {
      // TODO: Look into using https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
      let caller: any = arguments.callee.caller;
      builder = builder.setSource(caller && caller.name).setMessage(sourceOrMessage);
    }

    return builder;
  }

  public submitLog(message: string): void;
  public submitLog(source: string, message: string): void;
  public submitLog(source: string, message: string, level: string, callback?: (context: EventPluginContext) => void): void;
  public submitLog(sourceOrMessage: string, message?: string, level?: string, callback?: (context: EventPluginContext) => void): void {
    this.createLog(sourceOrMessage, message, level).submit(callback);
  }

  public createNotFound(resource: string): EventBuilder {
    return this.createEvent().setType('404').setSource(resource);
  }

  public submitNotFound(resource: string, callback?: (context: EventPluginContext) => void): void {
    this.createNotFound(resource).submit(callback);
  }

  public createSessionStart(): EventBuilder {
    return this.createEvent().setType('session');
  }

  public submitSessionStart(callback?: (context: EventPluginContext) => void): void {
    this.createSessionStart().submit(callback);
  }

  public submitSessionEnd(sessionIdOrUserId: string): void {
    if (sessionIdOrUserId) {
      this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, true, this.config);
    }
  }

  public submitSessionHeartbeat(sessionIdOrUserId: string): void {
    if (sessionIdOrUserId) {
      this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, false, this.config);
    }
  }

  public createEvent(pluginContextData?: ContextData): EventBuilder {
    return new EventBuilder({ date: new Date() }, this, pluginContextData);
  }

  /**
   * Submits the event to be sent to the server.
   * @param event The event data.
   * @param pluginContextData Any contextual data objects to be used by Exceptionless plugins to gather default information for inclusion in the report information.
   * @param callback
   */
  public submitEvent(event: IEvent, pluginContextData?: ContextData, callback?: (context: EventPluginContext) => void): void {
    function cancelled(context: EventPluginContext) {
      if (!!context) {
        context.cancelled = true;
      }

      return !!callback && callback(context);
    }

    let context = new EventPluginContext(this, event, pluginContextData);
    if (!event) {
      return cancelled(context);
    }

    if (!this.config.enabled) {
      this.config.log.info('Event submission is currently disabled.');
      return cancelled(context);
    }

    if (!event.data) {
      event.data = {};
    }

    if (!event.tags || !event.tags.length) {
      event.tags = [];
    }

    EventPluginManager.run(context, function(ctx: EventPluginContext) {
      let ev = ctx.event;
      if (!ctx.cancelled) {
        // ensure all required data
        if (!ev.type || ev.type.length === 0) {
          ev.type = 'log';
        }

        if (!ev.date) {
          ev.date = new Date();
        }

        let config = ctx.client.config;
        config.queue.enqueue(ev);

        if (ev.reference_id && ev.reference_id.length > 0) {
          ctx.log.info(`Setting last reference id '${ev.reference_id}'`);
          config.lastReferenceIdManager.setLast(ev.reference_id);
        }
      }

      !!callback && callback(ctx);
    });
  }

  /**
   * Updates the user's email address and description of an event for the specified reference id.
   * @param referenceId The reference id of the event to update.
   * @param email The user's email address to set on the event.
   * @param description The user's description of the event.
   * @param callback The submission response.
   */
  public updateUserEmailAndDescription(referenceId: string, email: string, description: string, callback?: (response: SubmissionResponse) => void) {
    if (!referenceId || !email || !description || !this.config.enabled) {
      return !!callback && callback(new SubmissionResponse(500, 'cancelled'));
    }

    let userDescription: IUserDescription = { email_address: email, description: description };
    this.config.submissionClient.postUserDescription(referenceId, userDescription, this.config, (response: SubmissionResponse) => {
      if (!response.success) {
        this.config.log.error(`Failed to submit user email and description for event '${referenceId}': ${response.statusCode} ${response.message}`);
      }

      !!callback && callback(response);
    });
  }

  /**
   * Gets the last event client id that was submitted to the server.
   * @returns {string} The event client id.
   */
  public getLastReferenceId(): string {
    return this.config.lastReferenceIdManager.getLast();
  }

  /**
   * The default ExceptionlessClient instance.
   * @type {ExceptionlessClient}
   */
  public static get default() {
    if (ExceptionlessClient._instance === null) {
      ExceptionlessClient._instance = new ExceptionlessClient(null);
    }

    return ExceptionlessClient._instance;
  }
}
