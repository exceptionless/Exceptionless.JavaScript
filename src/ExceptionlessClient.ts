import { Configuration } from './configuration/Configuration';
import { IConfigurationSettings } from './configuration/IConfigurationSettings';
import { SettingsManager } from './configuration/SettingsManager';
import { EventBuilder } from './EventBuilder';
import { IEvent } from './models/IEvent';
import { IUserDescription } from './models/IUserDescription';
import { ContextData } from './plugins/ContextData';
import { EventPluginContext } from './plugins/EventPluginContext';
import { EventPluginManager } from './plugins/EventPluginManager';
import { SubmissionResponse } from './submission/SubmissionResponse';

export class ExceptionlessClient {
  /**
   * The default ExceptionlessClient instance.
   * @type {ExceptionlessClient}
   * @private
   */
  private static _instance: ExceptionlessClient = null;

  public config: Configuration;

  private _intervalId: any;
  private _timeoutId: any;

  constructor();
  constructor(settings: IConfigurationSettings);
  constructor(apiKey: string, serverUrl?: string);
  constructor(settingsOrApiKey?: IConfigurationSettings | string, serverUrl?: string) {
    this.config = typeof settingsOrApiKey === 'object'
      ? new Configuration(settingsOrApiKey)
      : new Configuration({ apiKey:  settingsOrApiKey as string, serverUrl });

    this.updateSettingsTimer(5000);
    this.config.onChanged((config) => this.updateSettingsTimer(this._timeoutId > 0 ? 5000 : 0));
    this.config.queue.onEventsPosted((events, response) =>  this.updateSettingsTimer());
  }

  public createException(exception: Error): EventBuilder {
    const pluginContextData = new ContextData();
    pluginContextData.setException(exception);
    return this.createEvent(pluginContextData).setType('error');
  }

  public submitException(exception: Error, callback?: (context: EventPluginContext) => void): void {
    this.createException(exception).submit(callback);
  }

  public createUnhandledException(exception: Error, submissionMethod?: string): EventBuilder {
    const builder = this.createException(exception);
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

    if (level) {
      builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
    } else if (message) {
      builder = builder.setSource(sourceOrMessage).setMessage(message);
    } else {
      builder = builder.setMessage(sourceOrMessage);

      try {
        // TODO: Look into using https: //www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
        const caller: any = this.createLog.caller;
        builder = builder.setSource(caller && caller.caller && caller.caller.name);
      } catch (e) {
        this.config.log.trace('Unable to resolve log source: ' + e.message);
      }
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
      this.config.log.info(`Submitting session end: ${sessionIdOrUserId}`);
      this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, true, this.config);
    }
  }

  public submitSessionHeartbeat(sessionIdOrUserId: string): void {
    if (sessionIdOrUserId) {
      this.config.log.info(`Submitting session heartbeat: ${sessionIdOrUserId}`);
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

    const context = new EventPluginContext(this, event, pluginContextData);
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

    EventPluginManager.run(context, (ctx: EventPluginContext) => {
      const config = ctx.client.config;
      const ev = ctx.event;

      if (!ctx.cancelled) {
        // ensure all required data
        if (!ev.type || ev.type.length === 0) {
          ev.type = 'log';
        }

        if (!ev.date) {
          ev.date = new Date();
        }

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

    const userDescription: IUserDescription = { email_address: email, description };
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

  private updateSettingsTimer(initialDelay?: number) {
    this.config.log.info(`Updating settings timer with delay: ${initialDelay}`);

    this._timeoutId = clearTimeout(this._timeoutId);
    this._timeoutId = clearInterval(this._intervalId);

    const interval = this.config.updateSettingsWhenIdleInterval;
    if (interval > 0) {
      const updateSettings = () => SettingsManager.updateSettings(this.config);
      if (initialDelay > 0) {
        this._timeoutId = setTimeout(updateSettings, initialDelay);
      }

      this._intervalId = setInterval(updateSettings, interval);
    }
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
