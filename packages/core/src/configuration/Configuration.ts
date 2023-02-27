import { DefaultLastReferenceIdManager } from "../lastReferenceIdManager/DefaultLastReferenceIdManager.js";
import { ILastReferenceIdManager } from "../lastReferenceIdManager/ILastReferenceIdManager.js";
import { ILog } from "../logging/ILog.js";
import { ConsoleLog } from "../logging/ConsoleLog.js";
import { NullLog } from "../logging/NullLog.js";
import { UserInfo } from "../models/data/UserInfo.js";
import { HeartbeatPlugin } from "../plugins/default/HeartbeatPlugin.js";
import { SessionIdManagementPlugin } from "../plugins/default/SessionIdManagementPlugin.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";
import { EventPluginManager } from "../plugins/EventPluginManager.js";
import { IEventPlugin } from "../plugins/IEventPlugin.js";
import { DefaultEventQueue } from "../queue/DefaultEventQueue.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { ISubmissionClient } from "../submission/ISubmissionClient.js";
import { DefaultSubmissionClient } from "../submission/DefaultSubmissionClient.js";
import { guid } from "../Utils.js";
import { KnownEventDataKeys } from "../models/Event.js";
import { InMemoryStorage } from "../storage/InMemoryStorage.js";
import { IStorage } from "../storage/IStorage.js";
import { LocalStorage } from "../storage/LocalStorage.js";
import { ServerSettings } from "./SettingsManager.js";

export class Configuration {
  constructor() {
    this.services = {
      lastReferenceIdManager: new DefaultLastReferenceIdManager(),
      log: new NullLog(),
      storage: new InMemoryStorage(),
      queue: new DefaultEventQueue(this),
      submissionClient: new DefaultSubmissionClient(this),
    };

    EventPluginManager.addDefaultPlugins(this);
  }

  /**
   * A default list of tags that will automatically be added to every
   * report submitted to the server.
   */
  public defaultTags: string[] = [];

  /**
   * A default list of of extended data objects that will automatically
   * be added to every report submitted to the server.
   */
  public defaultData: Record<string, unknown> = {};

  /**
   * Whether the client is currently enabled or not. If it is disabled,
   * submitted errors will be discarded and no data will be sent to the server.
   *
   * @returns {boolean}
   */
  public enabled = true;

  public services: IConfigurationServices;

  /**
   * Maximum number of events that should be sent to the server together in a batch. (Defaults to 50)
   */
  public submissionBatchSize = 50;

  /**
   * Contains a dictionary of custom settings that can be used to control
   * the client and will be automatically updated from the server.
   */
  public settings: Record<string, string> = {};
  public settingsVersion = 0;

  /**
   * The API key that will be used when sending events to the server.
   */
  public apiKey = "";

  /**
   * The server url that all events will be sent to.
   * @type {string}
   */
  private _serverUrl = "https://collector.exceptionless.io";

  /**
   * The config server url that all configuration will be retrieved from.
   */
  public configServerUrl = "https://config.exceptionless.io";

  /**
   * The heartbeat server url that all heartbeats will be sent to.
   */
  public heartbeatServerUrl = "https://heartbeat.exceptionless.io";

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   */
  private _updateSettingsWhenIdleInterval = 120000;

  /**
   * A list of exclusion patterns.
   */
  private _dataExclusions: string[] = [];

  private _includePrivateInformation = true;
  private _includeUserName = true;
  private _includeMachineName = true;
  private _includeIpAddress = true;
  private _includeCookies = true;
  private _includePostData = true;
  private _includeQueryString = true;

  /**
   * A list of user agent patterns.
   */
  private _userAgentBotPatterns: string[] = [];

  /**
   * The list of plugins that will be used in this configuration.
   */
  private _plugins: IEventPlugin[] = [];

  /**
   * A list of subscribers that will be fired when configuration changes.
   */
  private _subscribers: Array<(config: Configuration) => void> = [];

  /**
   * Returns true if the apiKey is valid.
   */
  public get isValid(): boolean {
    return this.apiKey?.length >= 10;
  }

  /**
   * The server url that all events will be sent to.
   */
  public get serverUrl(): string {
    return this._serverUrl;
  }

  /**
   * The server url that all events will be sent to.
   */
  public set serverUrl(value: string) {
    if (value) {
      this._serverUrl = value;
      this.configServerUrl = value;
      this.heartbeatServerUrl = value;
    }
  }

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   */
  public get updateSettingsWhenIdleInterval(): number {
    return this._updateSettingsWhenIdleInterval;
  }

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   */
  public set updateSettingsWhenIdleInterval(value: number) {
    if (typeof value !== "number") {
      return;
    }

    if (value <= 0) {
      value = -1;
    } else if (value > 0 && value < 120000) {
      value = 120000;
    }

    this._updateSettingsWhenIdleInterval = value;
  }

  /**
   *  A list of exclusion patterns that will automatically remove any data that
   *  matches them from any data submitted to the server.
   *
   *  For example, entering CreditCard will remove any extended data properties,
   *  form fields, cookies and query parameters from the report.
   */
  public get dataExclusions(): string[] {
    // TODO: Known settings keys.
    const exclusions: string = this.settings["@@DataExclusions"];
    return this._dataExclusions.concat(
      exclusions && exclusions.split(",") || [],
    );
  }

  /**
   * Add items to the list of exclusion patterns that will automatically remove any
   * data that matches them from any data submitted to the server.
   *
   * For example, entering CreditCard will remove any extended data properties, form
   * fields, cookies and query parameters from the report.
   */
  public addDataExclusions(...exclusions: string[]): void {
    this._dataExclusions = [...this._dataExclusions, ...exclusions];
  }

  /**
   * Gets a value indicating whether to include private information about the local machine.
   */
  public get includePrivateInformation(): boolean {
    return this._includePrivateInformation;
  }

  /**
   * Sets a value indicating whether to include private information about the local machine
   */
  public set includePrivateInformation(value: boolean) {
    const val = value === true;
    this._includePrivateInformation = val;
    this._includeUserName = val;
    this._includeMachineName = val;
    this._includeIpAddress = val;
    this._includeCookies = val;
    this._includePostData = val;
    this._includeQueryString = val;
  }

  /**
   * Gets a value indicating whether to include User Name.
   */
  public get includeUserName(): boolean {
    return this._includeUserName;
  }

  /**
   * Sets a value indicating whether to include User Name.
   */
  public set includeUserName(value: boolean) {
    this._includeUserName = value === true;
  }

  /**
   * Gets a value indicating whether to include MachineName in MachineInfo.
   */
  public get includeMachineName(): boolean {
    return this._includeMachineName;
  }

  /**
   * Sets a value indicating whether to include MachineName in MachineInfo.
   */
  public set includeMachineName(value: boolean) {
    this._includeMachineName = value === true;
  }

  /**
   * Gets a value indicating whether to include Ip Addresses in MachineInfo and RequestInfo.
   */
  public get includeIpAddress(): boolean {
    return this._includeIpAddress;
  }

  /**
   * Sets a value indicating whether to include Ip Addresses in MachineInfo and RequestInfo.
   */
  public set includeIpAddress(value: boolean) {
    this._includeIpAddress = value === true;
  }

  /**
   * Gets a value indicating whether to include Cookies.
   * NOTE: DataExclusions are applied to all Cookie keys when enabled.
   */
  public get includeCookies(): boolean {
    return this._includeCookies;
  }

  /**
   * Sets a value indicating whether to include Cookies.
   * NOTE: DataExclusions are applied to all Cookie keys when enabled.
   */
  public set includeCookies(value: boolean) {
    this._includeCookies = value === true;
  }

  /**
   * Gets a value indicating whether to include Form/POST Data.
   * NOTE: DataExclusions are only applied to Form data keys when enabled.
   */
  public get includePostData(): boolean {
    return this._includePostData;
  }

  /**
   * Sets a value indicating whether to include Form/POST Data.
   * NOTE: DataExclusions are only applied to Form data keys when enabled.
   */
  public set includePostData(value: boolean) {
    this._includePostData = value === true;
  }

  /**
   * Gets a value indicating whether to include query string information.
   * NOTE: DataExclusions are applied to all Query String keys when enabled.
   */
  public get includeQueryString(): boolean {
    return this._includeQueryString;
  }

  /**
   * Sets a value indicating whether to include query string information.
   * NOTE: DataExclusions are applied to all Query String keys when enabled.
   */
  public set includeQueryString(value: boolean) {
    this._includeQueryString = value === true;
  }

  /**
   * A list of user agent patterns that will cause any event with a matching user agent to not be submitted.
   *
   * For example, entering *Bot* will cause any events that contains a user agent of Bot will not be submitted.
   */
  public get userAgentBotPatterns(): string[] {
    // TODO: Known settings keys.
    const patterns: string = this.settings["@@UserAgentBotPatterns"];
    return this._userAgentBotPatterns.concat(
      patterns && patterns.split(",") || [],
    );
  }

  /**
   * Add items to the list of user agent patterns that will cause any event with a matching user agent to not be submitted.
   *
   * For example, entering *Bot* will cause any events that contains a user agent of Bot will not be submitted.
   */
  public addUserAgentBotPatterns(...userAgentBotPatterns: string[]): void {
    this._userAgentBotPatterns = [
      ...this._userAgentBotPatterns,
      ...userAgentBotPatterns,
    ];
  }

  /**
   * The list of plugins that will be used in this configuration.
   */
  public get plugins(): IEventPlugin[] {
    return this._plugins.sort((p1: IEventPlugin, p2: IEventPlugin) => {
      if (p1 == null && p2 == null) {
        return 0;
      }

      if (p1?.priority == null) {
        return -1;
      }

      if (p2?.priority == null) {
        return 1;
      }

      if (p1.priority == p2.priority) {
        return 0;
      }

      return p1.priority > p2.priority ? 1 : -1;
    });
  }

  /**
   * Register an plugin to be used in this configuration.
   */
  public addPlugin(plugin: IEventPlugin): void;

  /**
   * Register an plugin to be used in this configuration.
   */
  public addPlugin(name: string | undefined, priority: number, pluginAction: (context: EventPluginContext) => Promise<void>): void;
  public addPlugin(pluginOrName: IEventPlugin | string | undefined, priority?: number, pluginAction?: (context: EventPluginContext) => Promise<void>): void {
    const plugin: IEventPlugin = pluginAction
      ? <IEventPlugin>{ name: pluginOrName as string, priority, run: pluginAction }
      : pluginOrName as IEventPlugin;

    if (!plugin || !(plugin.startup || plugin.run)) {
      this.services.log.error("Add plugin failed: startup or run method not defined");
      return;
    }

    if (!plugin.name) {
      plugin.name = guid();
    }

    if (!plugin.priority) {
      plugin.priority = 0;
    }

    if (!this._plugins.find(f => f.name === plugin.name)) {
      this._plugins.push(plugin);
    }
  }

  /**
   * Remove an plugin by key from this configuration.
   */
  public removePlugin(pluginOrName: IEventPlugin | string): void {
    const name: string = typeof pluginOrName === "string"
      ? pluginOrName
      : pluginOrName.name || "";
    if (!name) {
      this.services.log.error("Remove plugin failed: Plugin name not defined");
      return;
    }

    const plugins = this._plugins; // optimization for minifier.
    for (let index = 0; index < plugins.length; index++) {
      if (plugins[index].name === name) {
        plugins.splice(index, 1);
        break;
      }
    }
  }

  /**
   * The application version for events.
   */
  public get version(): string {
    return <string>this.defaultData[KnownEventDataKeys.Version];
  }

  /**
   * Set the application version for events.
   */
  public set version(version: string) {
    if (version) {
      this.defaultData[KnownEventDataKeys.Version] = version;
    } else {
      delete this.defaultData[KnownEventDataKeys.Version];
    }
  }

  /**
   * Set the default user identity for all events.
   */
  public setUserIdentity(userInfo: UserInfo): void;
  public setUserIdentity(identity: string): void;
  public setUserIdentity(identity: string, name: string): void;
  public setUserIdentity(userInfoOrIdentity: UserInfo | string, name?: string): void {
    const userInfo: UserInfo = typeof userInfoOrIdentity !== "string"
      ? userInfoOrIdentity
      : <UserInfo>{ identity: userInfoOrIdentity, name };

    const shouldRemove: boolean = !userInfo || (!userInfo.identity && !userInfo.name);
    if (shouldRemove) {
      delete this.defaultData[KnownEventDataKeys.UserInfo];
    } else {
      this.defaultData[KnownEventDataKeys.UserInfo] = userInfo;
    }

    this.services.log.info(`user identity: ${shouldRemove ? "null" : <string>userInfo.identity}`);
  }

  /**
   * Used to identify the client that sent the events to the server.
   */
  public get userAgent(): string {
    return "exceptionless-js/2.0.0-dev";
  }

  /**
   * Use localStorage for persisting things like server configuration cache and persisted queue entries (depends on usePersistedQueueStorage).
   */
  public useLocalStorage(): void {
    if (globalThis?.localStorage) {
      this.services.storage = new LocalStorage();
    }
  }

  /**
   * Writes events to storage on enqueue and removes them when submitted. (Defaults to false)
   * This setting only works in environments that supports persisted storage.
   * There is also a performance penalty of extra IO/serialization.
   */
  public usePersistedQueueStorage: boolean = false;

  /**
   * Gets or sets a value indicating whether to automatically send session start,
   * session heartbeats and session end events.
   */
  public sessionsEnabled = false;

  /**
   * Internal property used to track the current session identifier.
   */
  public currentSessionIdentifier: string | null = null;

  /**
   *
   * @param sendHeartbeats Controls whether heartbeat events are sent on an interval.
   * @param heartbeatInterval The interval at which heartbeats are sent after the last sent event. The default is 1 minutes.
   * @param useSessionIdManagement Allows you to manually control the session id. This is only recommended for single user desktop environments.
   */
  public useSessions(sendHeartbeats: boolean = true, heartbeatInterval: number = 60000, useSessionIdManagement: boolean = false) {
    this.sessionsEnabled = true;

    if (useSessionIdManagement) {
      this.addPlugin(new SessionIdManagementPlugin());
    }

    const plugin = new HeartbeatPlugin(heartbeatInterval);
    if (sendHeartbeats) {
      this.addPlugin(plugin);
    } else {
      this.removePlugin(plugin);
    }
  }

  private originalSettings?: Record<string, string>;

  public applyServerSettings(serverSettings: ServerSettings): void {
    if (!this.originalSettings)
      this.originalSettings = JSON.parse(JSON.stringify(this.settings)) as Record<string, string>;

    this.services.log.trace(`Applying saved settings: v${serverSettings.version}`);
    this.settings = Object.assign(this.originalSettings, serverSettings.settings);
    this.settingsVersion = serverSettings.version;
    this.notifySubscribers();
  }

  // TODO: Support a min log level.
  public useDebugLogger(): void {
    this.services.log = new ConsoleLog();
  }

  public subscribeServerSettingsChange(handler: (config: Configuration) => void): void {
    handler && this._subscribers.push(handler);
  }

  private notifySubscribers() {
    for (const handler of this._subscribers) {
      try {
        handler(this);
      } catch (ex) {
        this.services.log.error(`Error calling subscribe handler: ${ex instanceof Error ? ex.message : ex + ''}`);
      }
    }
  }
}

interface IConfigurationServices {
  lastReferenceIdManager: ILastReferenceIdManager;
  log: ILog;
  submissionClient: ISubmissionClient;
  storage: IStorage;
  queue: IEventQueue;
}
