import { Configuration } from "./configuration/Configuration.js";
import { SettingsManager } from "./configuration/SettingsManager.js";
import { EventBuilder } from "./EventBuilder.js";
import { Event, KnownEventDataKeys } from "./models/Event.js";
import { UserDescription } from "./models/data/UserDescription.js";
import { EventContext } from "./models/EventContext.js";
import { EventPluginContext } from "./plugins/EventPluginContext.js";
import { EventPluginManager } from "./plugins/EventPluginManager.js";
import { PluginContext } from "./plugins/PluginContext.js";

export class ExceptionlessClient {
  private _intervalId: ReturnType<typeof setInterval> | undefined;
  private _timeoutId: ReturnType<typeof setTimeout> | undefined;
  protected _initialized = false;

  public constructor(public config: Configuration = new Configuration()) { }

  /** Resume background submission, resume any timers. */
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    if (configurationOrApiKey && !this._initialized) {
      this._initialized = true;

      if (typeof configurationOrApiKey === "string") {
        this.config.apiKey = configurationOrApiKey;
      } else {
        configurationOrApiKey(this.config);
      }

      this.config.services.queue.onEventsPosted(() =>
        Promise.resolve(this.updateSettingsTimer())
      );
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
    clearTimeout(this._timeoutId);
    this._timeoutId = undefined;
    clearInterval(this._intervalId);
    this._intervalId = undefined;
  }

  public async processQueue(): Promise<void> {
    await this.config.services.queue.process();
  }

  private updateSettingsTimer(startingUp = false) {
    this.suspendSettingsTimer();

    const interval = this.config.updateSettingsWhenIdleInterval;
    if (interval > 0) {
      let initialDelay: number = interval;
      if (startingUp) {
        initialDelay = this.config.settingsVersion > 0 ? 15000 : 5000;
      }

      this.config.services.log.info(
        `Update settings every ${interval}ms (${initialDelay || 0}ms delay)`,
      );
      // TODO: Look into better async scheduling..
      const updateSettings = () =>
        void SettingsManager.updateSettings(this.config);
      if (initialDelay < interval) {
        this._timeoutId = setTimeout(updateSettings, initialDelay);
      }

      this._intervalId = setInterval(updateSettings, interval);
    }
  }

  public createException(exception: Error): EventBuilder {
    const pluginContextData = new EventContext();
    pluginContextData.setException(exception);
    return this.createEvent(pluginContextData).setType("error");
  }

  public submitException(exception: Error): Promise<EventPluginContext> {
    return this.createException(exception).submit();
  }

  public createUnhandledException(exception: Error, submissionMethod?: string): EventBuilder {
    const builder = this.createException(exception);
    builder.context.markAsUnhandledError();
    builder.context.setSubmissionMethod(submissionMethod || "");

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
  public createLog(source: string | undefined, message: string, level: string): EventBuilder;
  public createLog(sourceOrMessage: string, message?: string, level?: string): EventBuilder {
    let builder = this.createEvent().setType("log");

    if (level) {
      builder = builder.setSource(sourceOrMessage).setMessage(message)
        .setProperty(KnownEventDataKeys.Level, level);
    } else if (message) {
      builder = builder.setSource(sourceOrMessage).setMessage(message);
    } else {
      builder = builder.setMessage(sourceOrMessage);

      try {
        // TODO: Look into using https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
        const caller = this.createLog.caller;
        builder = builder.setSource(
          caller && caller.caller && caller.caller.name,
        );
      } catch (ex) {
        this.config.services.log.trace(`Unable to resolve log source: ${ex instanceof Error ? ex.message : ex + ''}`);
      }
    }

    return builder;
  }

  public submitLog(message: string): Promise<EventPluginContext>;
  public submitLog(source: string, message: string): Promise<EventPluginContext>;
  public submitLog(source: string | undefined, message: string, level: string): Promise<EventPluginContext>;
  public submitLog(sourceOrMessage: string, message?: string, level?: string): Promise<EventPluginContext> {
    return this.createLog(sourceOrMessage, <string>message, <string>level).submit();
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
      this.config.services.log.info(
        `Submitting session end: ${sessionIdOrUserId}`,
      );
      await this.config.services.submissionClient.submitHeartbeat(
        sessionIdOrUserId,
        true,
      );
    }
  }

  public async submitSessionHeartbeat(sessionIdOrUserId: string): Promise<void> {
    if (sessionIdOrUserId && this.config.enabled && this.config.isValid) {
      this.config.services.log.info(
        `Submitting session heartbeat: ${sessionIdOrUserId}`,
      );
      await this.config.services.submissionClient.submitHeartbeat(
        sessionIdOrUserId,
        false,
      );
    }
  }

  public createEvent(context?: EventContext): EventBuilder {
    return new EventBuilder({ date: new Date() }, this, context);
  }

  /**
   * Submits the event to the server.
   *
   * @param event The event
   * @param context Contextual data used by event plugins to enrich the event details
   */
  public async submitEvent(event: Event, context?: EventContext): Promise<EventPluginContext> {
    const pluginContext = new EventPluginContext(this, event, context ?? new EventContext());

    if (!event) {
      pluginContext.cancelled = true;
      return pluginContext;
    }

    if (!this.config.enabled || !this.config.isValid) {
      this.config.services.log.info("Event submission is currently disabled.");
      pluginContext.cancelled = true;
      return pluginContext;
    }

    if (!event.data) {
      event.data = {};
    }

    if (!event.tags || !event.tags.length) {
      event.tags = [];
    }

    await EventPluginManager.run(pluginContext);
    if (pluginContext.cancelled) {
      return pluginContext;
    }

    const ev = pluginContext.event;

    // ensure all required data
    if (!ev.type || ev.type.length === 0) {
      ev.type = "log";
    }

    if (!ev.date) {
      ev.date = new Date();
    }

    await this.config.services.queue.enqueue(ev);

    if (ev.reference_id && ev.reference_id.length > 0) {
      pluginContext.log.info(`Setting last reference id "${ev.reference_id}"`);
      this.config.services.lastReferenceIdManager.setLast(ev.reference_id);
    }

    return pluginContext;
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

    const userDescription: UserDescription = { email_address: email, description };
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
  public getLastReferenceId(): string | null {
    return this.config.services.lastReferenceIdManager.getLast();
  }
}
