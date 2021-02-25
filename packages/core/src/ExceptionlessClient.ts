import { Configuration } from './configuration/Configuration.js';
import { IConfigurationSettings } from './configuration/IConfigurationSettings.js';
import { SettingsManager } from './configuration/SettingsManager.js';
import { EventBuilder } from './EventBuilder.js';
import { IEvent } from './models/IEvent.js';
import { IUserDescription } from './models/IUserDescription.js';
import { ContextData } from './plugins/ContextData.js';
import { EventPluginContext } from './plugins/EventPluginContext.js';
import { EventPluginManager } from './plugins/EventPluginManager.js';
import { SubmissionResponse } from './submission/SubmissionResponse.js';

export class ExceptionlessClient {
  /**
   * The default ExceptionlessClient instance.
   *
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
      : new Configuration({ apiKey: settingsOrApiKey, serverUrl });

    this.updateSettingsTimer(5000);
    this.config.onChanged(() => this.updateSettingsTimer(this._timeoutId > 0 ? 5000 : 0));
    this.config.queue.onEventsPosted(() => this.updateSettingsTimer());
  }

  public createException(exception: Error): EventBuilder {
    const pluginContextData = new ContextData();
    pluginContextData.setException(exception);
    return this.createEvent(pluginContextData).setType('error');
  }

  public submitException(exception: Error): Promise<EventPluginContext> {
    return this.createException(exception).submit();
  }

  public createUnhandledException(exception: Error, submissionMethod?: string): EventBuilder {
    const builder = this.createException(exception);
    builder.pluginContextData.markAsUnhandledError();
    builder.pluginContextData.setSubmissionMethod(submissionMethod);

    return builder;
  }

  public submitUnhandledException(exception: Error, submissionMethod?: string): Promise<EventPluginContext> {
    return this.createUnhandledException(exception, submissionMethod).submit();
  }

  public createFeatureUsage(feature: string): EventBuilder {
    return this.createEvent().setType('usage').setSource(feature);
  }

  public submitFeatureUsage(feature: string): Promise<EventPluginContext> {
    return this.createFeatureUsage(feature).submit();
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
        // TODO: Look into using https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
        const caller: any = this.createLog.caller;
        builder = builder.setSource(caller && caller.caller && caller.caller.name);
      } catch (e) {
        this.config.log.trace('Unable to resolve log source: ' + e.message);
      }
    }

    return builder;
  }

  public submitLog(message: string): Promise<EventPluginContext>
  public submitLog(source: string, message: string): Promise<EventPluginContext>
  public submitLog(source: string, message: string, level: string): Promise<EventPluginContext>;
  public submitLog(sourceOrMessage: string, message?: string, level?: string): Promise<EventPluginContext> {
    return this.createLog(sourceOrMessage, message, level).submit();
  }

  public createNotFound(resource: string): EventBuilder {
    return this.createEvent().setType('404').setSource(resource);
  }

  public submitNotFound(resource: string): Promise<EventPluginContext> {
    return this.createNotFound(resource).submit();
  }

  public createSessionStart(): EventBuilder {
    return this.createEvent().setType('session');
  }

  public submitSessionStart(): Promise<EventPluginContext> {
    return this.createSessionStart().submit();
  }

  public submitSessionEnd(sessionIdOrUserId: string): void {
    if (sessionIdOrUserId && this.config.enabled && this.config.isValid) {
      this.config.log.info(`Submitting session end: ${sessionIdOrUserId}`);
      this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, true, this.config);
    }
  }

  public submitSessionHeartbeat(sessionIdOrUserId: string): void {
    if (sessionIdOrUserId && this.config.enabled && this.config.isValid) {
      this.config.log.info(`Submitting session heartbeat: ${sessionIdOrUserId}`);
      this.config.submissionClient.sendHeartbeat(sessionIdOrUserId, false, this.config);
    }
  }

  public createEvent(pluginContextData?: ContextData): EventBuilder {
    return new EventBuilder({ date: new Date() }, this, pluginContextData);
  }

  /**
   * Submits the event to be sent to the server.
   *
   * @param event The event data.
   * @param pluginContextData Any contextual data objects to be used by Exceptionless plugins to gather default information for inclusion in the report information.
   * @param callback
   */
  public async submitEvent(event: IEvent, pluginContextData?: ContextData): Promise<EventPluginContext> {
    const context = new EventPluginContext(this, event, pluginContextData);
    if (!event) {
      context.cancelled = true;
      return context;
    }

    if (!this.config.enabled || !this.config.isValid) {
      this.config.log.info('Event submission is currently disabled.');
      context.cancelled = true;
      return context;
    }

    if (!event.data) {
      event.data = {};
    }

    if (!event.tags || !event.tags.length) {
      event.tags = [];
    }

    await EventPluginManager.run(context);
    if (context.cancelled) {
      return context;
    }

    const config = context.client.config;
    const ev = context.event;

    // ensure all required data
    if (!ev.type || ev.type.length === 0) {
      ev.type = 'log';
    }

    if (!ev.date) {
      ev.date = new Date();
    }

    config.queue.enqueue(ev);

    if (ev.reference_id && ev.reference_id.length > 0) {
      context.log.info(`Setting last reference id '${ev.reference_id}'`);
      config.lastReferenceIdManager.setLast(ev.reference_id);
    }
  }

  /**
   * Updates the user's email address and description of an event for the specified reference id.
   * @param referenceId The reference id of the event to update.
   * @param email The user's email address to set on the event.
   * @param description The user's description of the event.
   * @param callback The submission response.
   */
  public updateUserEmailAndDescription(referenceId: string, email: string, description: string, callback?: (response: SubmissionResponse) => void) {
    if (!referenceId || !email || !description || !this.config.enabled || !this.config.isValid) {
      return callback && callback(new SubmissionResponse(500, 'cancelled'));
    }

    const userDescription: IUserDescription = { email_address: email, description };
    this.config.submissionClient.postUserDescription(referenceId, userDescription, this.config, (response: SubmissionResponse) => {
      if (!response.success) {
        this.config.log.error(`Failed to submit user email and description for event '${referenceId}': ${response.statusCode} ${response.message}`);
      }

      callback && callback(response);
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
    this._timeoutId = clearTimeout(this._timeoutId);
    this._timeoutId = clearInterval(this._intervalId);

    const interval = this.config.updateSettingsWhenIdleInterval;
    if (interval > 0) {
      this.config.log.info(`Update settings every ${interval}ms (${initialDelay || 0}ms delay)`);
      const updateSettings = () => SettingsManager.updateSettings(this.config);
      if (initialDelay > 0) {
        this._timeoutId = setTimeout(updateSettings, initialDelay);
      }

      this._intervalId = setInterval(updateSettings, interval);
    } else {
      this.config.log.info("Turning off update settings");
    }
  }

  // TODO: Remove or rename.
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
