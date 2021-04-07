import { Configuration } from "./configuration/Configuration.js";
import { SettingsManager } from "./configuration/SettingsManager.js";
import { EventBuilder } from "./EventBuilder.js";
import { Event, KnownEventDataKeys } from "./models/Event.js";
import { UserDescription } from "./models/data/UserDescription.js";
import { ContextData } from "./plugins/ContextData.js";
import { EventPluginContext } from "./plugins/EventPluginContext.js";
import { EventPluginManager } from "./plugins/EventPluginManager.js";
import { PluginContext } from "./plugins/PluginContext.js";

export class ExceptionlessClient {
  private _intervalId: any;
  private _timeoutId: any;

  public constructor(public config: Configuration = new Configuration()) { }

  /** Resume background submission, resume any timers. */
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    if (configurationOrApiKey) {
      EventPluginManager.addDefaultPlugins(this.config);

      if (typeof configurationOrApiKey === "string") {
        this.config.apiKey = configurationOrApiKey;
      } else {
        configurationOrApiKey(this.config);
      }

      this.config.services.queue.onEventsPosted(() => Promise.resolve(this.updateSettingsTimer()));
      await SettingsManager.applySavedServerSettings(this.config);
    }

    this.updateSettingsTimer(!!configurationOrApiKey);
    await EventPluginManager.startup(new PluginContext(this));
    const { queue } = this.config.services;
    await queue.startup();
    if (this.config.usePersistedQueueStorage) {
      // TODO: Can we schedule this as part of startup?
      await queue.process();
    }
  }

  /** Submit events, pause any timers and go into low power mode. */
  public async suspend(): Promise<void> {
    await EventPluginManager.suspend(new PluginContext(this));
    const { queue } = this.config.services;
    await queue.suspend();
    await queue.process();
    this.suspendSettingsTimer();
  }

  private suspendSettingsTimer(): void {
    this._timeoutId = clearTimeout(this._timeoutId);
    this._intervalId = clearInterval(this._intervalId);
  }

  public async processQueue(): Promise<void> {
    await this.config.services.queue.process();
  }

  private updateSettingsTimer(startingUp: boolean = false) {
    this.suspendSettingsTimer();

    const interval = this.config.updateSettingsWhenIdleInterval;
    if (interval > 0) {
      let initialDelay: number = interval;
      if (startingUp) {
        initialDelay = this.config.settingsVersion > 0 ? 15000 : 5000;
      }

      this.config.services.log.info(`Update settings every ${interval}ms (${initialDelay || 0}ms delay)`);
      // TODO: Look into better async scheduling..
      const updateSettings = () => void SettingsManager.updateSettings(this.config);
      if (initialDelay < interval) {
        this._timeoutId = setTimeout(updateSettings, initialDelay);
      }

      this._intervalId = setInterval(updateSettings, interval);
    }
  }

  public createException(exception: Error): EventBuilder {
    const pluginContextData = new ContextData();
    pluginContextData.setException(exception);
    return this.createEvent(pluginContextData).setType("error");
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
    return this.createEvent().setType("usage").setSource(feature);
  }

  public submitFeatureUsage(feature: string): Promise<EventPluginContext> {
    return this.createFeatureUsage(feature).submit();
  }

  public createLog(message: string): EventBuilder;
  public createLog(source: string, message: string): EventBuilder;
  public createLog(source: string, message: string, level: string): EventBuilder;
  public createLog(sourceOrMessage: string, message?: string, level?: string): EventBuilder {
    let builder = this.createEvent().setType("log");

    if (level) {
      builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty(KnownEventDataKeys.Level, level);
    } else if (message) {
      builder = builder.setSource(sourceOrMessage).setMessage(message);
    } else {
      builder = builder.setMessage(sourceOrMessage);

      try {
        // TODO: Look into using https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
        const caller: any = this.createLog.caller;
        builder = builder.setSource(
          caller && caller.caller && caller.caller.name,
        );
      } catch (e) {
        this.config.services.log.trace("Unable to resolve log source: " + e.message);
      }
    }

    return builder;
  }

  public submitLog(message: string): Promise<EventPluginContext>;
  public submitLog(source: string, message: string): Promise<EventPluginContext>;
  public submitLog(source: string, message: string, level: string): Promise<EventPluginContext>;
  public submitLog(sourceOrMessage: string, message?: string, level?: string): Promise<EventPluginContext> {
    return this.createLog(sourceOrMessage, message, level).submit();
  }

  public createNotFound(resource: string): EventBuilder {
    return this.createEvent().setType("404").setSource(resource);
  }

  public submitNotFound(resource: string): Promise<EventPluginContext> {
    return this.createNotFound(resource).submit();
  }

  public createSessionStart(): EventBuilder {
    return this.createEvent().setType("session");
  }

  public submitSessionStart(): Promise<EventPluginContext> {
    return this.createSessionStart().submit();
  }

  public async submitSessionEnd(sessionIdOrUserId: string): Promise<void> {
    if (sessionIdOrUserId && this.config.enabled && this.config.isValid) {
      this.config.services.log.info(`Submitting session end: ${sessionIdOrUserId}`);
      await this.config.services.submissionClient.submitHeartbeat(sessionIdOrUserId, true);
    }
  }

  public async submitSessionHeartbeat(sessionIdOrUserId: string): Promise<void> {
    if (sessionIdOrUserId && this.config.enabled && this.config.isValid) {
      this.config.services.log.info(`Submitting session heartbeat: ${sessionIdOrUserId}`);
      await this.config.services.submissionClient.submitHeartbeat(sessionIdOrUserId, false);
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
  public async submitEvent(event: Event, pluginContextData?: ContextData): Promise<EventPluginContext> {
    const context = new EventPluginContext(this, event, pluginContextData);
    if (!event) {
      context.cancelled = true;
      return context;
    }

    if (!this.config.enabled || !this.config.isValid) {
      this.config.services.log.info("Event submission is currently disabled.");
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
      ev.type = "log";
    }

    if (!ev.date) {
      ev.date = new Date();
    }

    await config.services.queue.enqueue(ev);

    if (ev.reference_id && ev.reference_id.length > 0) {
      context.log.info(`Setting last reference id "${ev.reference_id}"`);
      config.services.lastReferenceIdManager.setLast(ev.reference_id);
    }

    return context;
  }

  /**
   * Updates the user"s email address and description of an event for the specified reference id.
   * @param referenceId The reference id of the event to update.
   * @param email The user"s email address to set on the event.
   * @param description The user"s description of the event.
   * @param callback The submission response.
   */
  public async updateUserEmailAndDescription(referenceId: string, email: string, description: string): Promise<void> {
    if (!referenceId || !email || !description || !this.config.enabled || !this.config.isValid) {
      return;
    }

    const userDescription: UserDescription = {
      email_address: email,
      description
    };
    const response = await this.config.services.submissionClient.submitUserDescription(referenceId, userDescription);
    if (!response.success) {
      this.config.services.log.error(
        `Failed to submit user email and description for event "${referenceId}": ${response.status} ${response.message}`,
      );
    }
  }

  /**
   * Gets the last event client id that was submitted to the server.
   * @returns {string} The event client id.
   */
  public getLastReferenceId(): string {
    return this.config.services.lastReferenceIdManager.getLast();
  }
}
