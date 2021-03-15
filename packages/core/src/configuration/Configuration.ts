import { DefaultLastReferenceIdManager } from "../lastReferenceIdManager/DefaultLastReferenceIdManager.js";
import { ILastReferenceIdManager } from "../lastReferenceIdManager/ILastReferenceIdManager.js";
import { ILog } from "../logging/ILog.js";
import { ConsoleLog } from "../logging/ConsoleLog.js";
import { NullLog } from "../logging/NullLog.js";
import { UserInfo } from "../models/data/UserInfo.js";
import { HeartbeatPlugin } from "../plugins/default/HeartbeatPlugin.js";
import { ReferenceIdPlugin } from "../plugins/default/ReferenceIdPlugin.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";
import { IEventPlugin } from "../plugins/IEventPlugin.js";
import { DefaultEventQueue } from "../queue/DefaultEventQueue.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { IEnvironmentInfoCollector } from "../services/IEnvironmentInfoCollector.js";
import { IErrorParser } from "../services/IErrorParser.js";
import { IModuleCollector } from "../services/IModuleCollector.js";
import { IRequestInfoCollector } from "../services/IRequestInfoCollector.js";
import { InMemoryStorageProvider } from "../storage/InMemoryStorageProvider.js";
import { IStorageProvider } from "../storage/IStorageProvider.js";
import { ISubmissionClient } from "../submission/ISubmissionClient.js";
import { guid } from "../Utils.js";
import { KnownEventDataKeys } from "../models/Event.js";

export class Configuration {
  /**
   * A default list of tags that will automatically be added to every
   * report submitted to the server.
   *
   * @type {Array}
   */
  public defaultTags: string[] = [];

  /**
   * A default list of of extended data objects that will automatically
   * be added to every report submitted to the server.
   *
   * @type {{}}
   */
  public defaultData: Record<string, unknown> = {};

  /**
   * Whether the client is currently enabled or not. If it is disabled,
   * submitted errors will be discarded and no data will be sent to the server.
   *
   * @returns {boolean}
   */
  public enabled: boolean = true;

  // TODO: Move this into services sub object
  public environmentInfoCollector: IEnvironmentInfoCollector;
  public errorParser: IErrorParser;
  public lastReferenceIdManager: ILastReferenceIdManager = new DefaultLastReferenceIdManager();
  public log: ILog = new NullLog();
  public moduleCollector: IModuleCollector;
  public requestInfoCollector: IRequestInfoCollector;

  /**
   * Maximum number of events that should be sent to the server together in a batch. (Defaults to 50)
   */
  public submissionBatchSize: number = 50;
  public submissionClient: ISubmissionClient;

  /**
   * Contains a dictionary of custom settings that can be used to control
   * the client and will be automatically updated from the server.
   */
  public settings: Record<string, string> = {};

  public storage: IStorageProvider = new InMemoryStorageProvider();

  public queue: IEventQueue = new DefaultEventQueue(this);

  /**
   * The API key that will be used when sending events to the server.
   * @type {string}
   * @private
   */
  private _apiKey: string;

  /**
   * The server url that all events will be sent to.
   * @type {string}
   * @private
   */
  private _serverUrl: string = "https://collector.exceptionless.io";

  /**
   * The config server url that all configuration will be retrieved from.
   * @type {string}
   * @private
   */
  private _configServerUrl: string = "https://config.exceptionless.io";

  /**
   * The heartbeat server url that all heartbeats will be sent to.
   * @type {string}
   * @private
   */
  private _heartbeatServerUrl: string = "https://heartbeat.exceptionless.io";

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   * @type {number}
   * @private
   */
  private _updateSettingsWhenIdleInterval: number = 120000;

  /**
   * A list of exclusion patterns.
   * @type {Array}
   * @private
   */
  private _dataExclusions: string[] = [];

  private _includePrivateInformation: boolean;
  private _includeUserName: boolean;
  private _includeMachineName: boolean;
  private _includeIpAddress: boolean;
  private _includeCookies: boolean;
  private _includePostData: boolean;
  private _includeQueryString: boolean;

  /**
   * A list of user agent patterns.
   * @type {Array}
   * @private
   */
  private _userAgentBotPatterns: string[] = [];

  /**
   * The list of plugins that will be used in this configuration.
   * @type {Array}
   * @private
   */
  private _plugins: IEventPlugin[] = [];

  /**
   * A list of handlers that will be fired when configuration changes.
   * @type {Array}
   * @private
   */
  private _handlers: Array<(config: Configuration) => void> = [];

  /**
   * The API key that will be used when sending events to the server.
   * @returns {string}
   */
  public get apiKey(): string {
    return this._apiKey;
  }

  /**
   * The API key that will be used when sending events to the server.
   * @param value
   */
  public set apiKey(value: string) {
    this._apiKey = value || null;
    this.log.info(`apiKey: ${this._apiKey}`);
    this.changed();
  }

  /**
   * Returns true if the apiKey is valid.
   * @returns {boolean}
   */
  public get isValid(): boolean {
    return this.apiKey && this.apiKey.length >= 10;
  }

  /**
   * The server url that all events will be sent to.
   * @returns {string}
   */
  public get serverUrl(): string {
    return this._serverUrl;
  }

  /**
   * The server url that all events will be sent to.
   * @param value
   */
  public set serverUrl(value: string) {
    if (value) {
      this._serverUrl = value;
      this._configServerUrl = value;
      this._heartbeatServerUrl = value;
      this.log.info(`serverUrl: ${value}`);
      this.changed();
    }
  }

  /**
   * The config server url that all configuration will be retrieved from.
   * @returns {string}
   */
  public get configServerUrl(): string {
    return this._configServerUrl;
  }

  /**
   * The config server url that all configuration will be retrieved from.
   * @param value
   */
  public set configServerUrl(value: string) {
    if (value) {
      this._configServerUrl = value;
      this.log.info(`configServerUrl: ${value}`);
      this.changed();
    }
  }

  /**
   * The heartbeat server url that all heartbeats will be sent to.
   * @returns {string}
   */
  public get heartbeatServerUrl(): string {
    return this._heartbeatServerUrl;
  }

  /**
   * The heartbeat server url that all heartbeats will be sent to.
   * @param value
   */
  public set heartbeatServerUrl(value: string) {
    if (value) {
      this._heartbeatServerUrl = value;
      this.log.info(`heartbeatServerUrl: ${value}`);
      this.changed();
    }
  }

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   * @returns {number}
   */
  public get updateSettingsWhenIdleInterval(): number {
    return this._updateSettingsWhenIdleInterval;
  }

  /**
   * How often the client should check for updated server settings when idle. The default is every 2 minutes.
   * @param value
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
    this.log.info(`updateSettingsWhenIdleInterval: ${value}`);
    this.changed();
  }

  /**
   *  A list of exclusion patterns that will automatically remove any data that
   *  matches them from any data submitted to the server.
   *
   *  For example, entering CreditCard will remove any extended data properties,
   *  form fields, cookies and query parameters from the report.
   *
   * @returns {string[]}
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
   *
   * @param exclusions
   */
  public addDataExclusions(...exclusions: string[]) {
    this._dataExclusions = [...this._dataExclusions, ...exclusions];
  }

  /**
   * Gets a value indicating whether to include private information about the local machine.
   * @returns {boolean}
   */
  public get includePrivateInformation(): boolean {
    return this._includePrivateInformation;
  }

  /**
   * Sets a value indicating whether to include private information about the local machine
   * @param value
   */
  public set includePrivateInformation(value: boolean) {
    const val = value || false;
    this._includePrivateInformation = val;
    this._includeUserName = val;
    this._includeMachineName = val;
    this._includeIpAddress = val;
    this._includeCookies = val;
    this._includePostData = val;
    this._includeQueryString = val;
    this.log.info(`includePrivateInformation: ${val}`);
    this.changed();
  }

  /**
   * Gets a value indicating whether to include User Name.
   * @returns {boolean}
   */
  public get includeUserName(): boolean {
    return this._includeUserName;
  }

  /**
   * Sets a value indicating whether to include User Name.
   * @param value
   */
  public set includeUserName(value: boolean) {
    this._includeUserName = value || false;
    this.changed();
  }

  /**
   * Gets a value indicating whether to include MachineName in MachineInfo.
   * @returns {boolean}
   */
  public get includeMachineName(): boolean {
    return this._includeMachineName;
  }

  /**
   * Sets a value indicating whether to include MachineName in MachineInfo.
   * @param value
   */
  public set includeMachineName(value: boolean) {
    this._includeMachineName = value || false;
    this.changed();
  }

  /**
   * Gets a value indicating whether to include Ip Addresses in MachineInfo and RequestInfo.
   * @returns {boolean}
   */
  public get includeIpAddress(): boolean {
    return this._includeIpAddress;
  }

  /**
   * Sets a value indicating whether to include Ip Addresses in MachineInfo and RequestInfo.
   * @param value
   */
  public set includeIpAddress(value: boolean) {
    this._includeIpAddress = value || false;
    this.changed();
  }

  /**
   * Gets a value indicating whether to include Cookies.
   * NOTE: DataExclusions are applied to all Cookie keys when enabled.
   * @returns {boolean}
   */
  public get includeCookies(): boolean {
    return this._includeCookies;
  }

  /**
   * Sets a value indicating whether to include Cookies.
   * NOTE: DataExclusions are applied to all Cookie keys when enabled.
   * @param value
   */
  public set includeCookies(value: boolean) {
    this._includeCookies = value || false;
    this.changed();
  }

  /**
   * Gets a value indicating whether to include Form/POST Data.
   * NOTE: DataExclusions are only applied to Form data keys when enabled.
   * @returns {boolean}
   */
  public get includePostData(): boolean {
    return this._includePostData;
  }

  /**
   * Sets a value indicating whether to include Form/POST Data.
   * NOTE: DataExclusions are only applied to Form data keys when enabled.
   * @param value
   */
  public set includePostData(value: boolean) {
    this._includePostData = value || false;
    this.changed();
  }

  /**
   * Gets a value indicating whether to include query string information.
   * NOTE: DataExclusions are applied to all Query String keys when enabled.
   * @returns {boolean}
   */
  public get includeQueryString(): boolean {
    return this._includeQueryString;
  }

  /**
   * Sets a value indicating whether to include query string information.
   * NOTE: DataExclusions are applied to all Query String keys when enabled.
   * @param value
   */
  public set includeQueryString(value: boolean) {
    this._includeQueryString = value || false;
    this.changed();
  }

  /**
   * A list of user agent patterns that will cause any event with a matching user agent to not be submitted.
   *
   * For example, entering *Bot* will cause any events that contains a user agent of Bot will not be submitted.
   *
   * @returns {string[]}
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
   *
   * @param userAgentBotPatterns
   */
  public addUserAgentBotPatterns(...userAgentBotPatterns: string[]) {
    this._userAgentBotPatterns = [...this._userAgentBotPatterns, ...userAgentBotPatterns];
  }

  /**
   * The list of plugins that will be used in this configuration.
   * @returns {IEventPlugin[]}
   */
  public get plugins(): IEventPlugin[] {
    return this._plugins.sort((p1: IEventPlugin, p2: IEventPlugin) => {
      return (p1.priority < p2.priority)
        ? -1
        : (p1.priority > p2.priority)
        ? 1
        : 0;
    });
  }

  /**
   * Register an plugin to be used in this configuration.
   * @param plugin
   */
  public addPlugin(plugin: IEventPlugin): void;

  /**
   * Register an plugin to be used in this configuration.
   * @param name The name used to identify the plugin.
   * @param priority Used to determine plugins priority.
   * @param pluginAction A function that is run.
   */
  public addPlugin(
    name: string,
    priority: number,
    pluginAction: (context: EventPluginContext) => Promise<void>,
  ): void;
  public addPlugin(
    pluginOrName: IEventPlugin | string,
    priority?: number,
    pluginAction?: (context: EventPluginContext) => Promise<void>,
  ): void {
    const plugin: IEventPlugin = pluginAction
      ? { name: pluginOrName as string, priority, run: pluginAction }
      : pluginOrName as IEventPlugin;
    if (!plugin || !plugin.run) {
      this.log.error("Add plugin failed: Run method not defined");
      return;
    }

    if (!plugin.name) {
      plugin.name = guid();
    }

    if (!plugin.priority) {
      plugin.priority = 0;
    }

    let pluginExists: boolean = false;
    const plugins = this._plugins; // optimization for minifier.
    for (const p of plugins) {
      if (p.name === plugin.name) {
        pluginExists = true;
        break;
      }
    }

    if (!pluginExists) {
      plugins.push(plugin);
    }
  }

  /**
   * Remove the plugin from this configuration.
   * @param plugin
   */
  public removePlugin(plugin: IEventPlugin): void;

  /**
   * Remove an plugin by key from this configuration.
   * @param name
   */
  public removePlugin(pluginOrName: IEventPlugin | string): void {
    const name: string = typeof pluginOrName === "string"
      ? pluginOrName
      : pluginOrName.name;
    if (!name) {
      this.log.error("Remove plugin failed: Plugin name not defined");
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
   * Automatically set the application version for events.
   * @param version
   */
  public setVersion(version: string): void {
    if (version) {
      this.defaultData[KnownEventDataKeys.Version] = version;
    }
  }

  public setUserIdentity(userInfo: UserInfo): void;
  public setUserIdentity(identity: string): void;
  public setUserIdentity(identity: string, name: string): void;
  public setUserIdentity(
    userInfoOrIdentity: UserInfo | string,
    name?: string,
  ): void {
    const userInfo: UserInfo = typeof userInfoOrIdentity !== "string"
      ? userInfoOrIdentity
      : { identity: userInfoOrIdentity, name };

    const shouldRemove: boolean = !userInfo ||
      (!userInfo.identity && !userInfo.name);
    if (shouldRemove) {
      delete this.defaultData[KnownEventDataKeys.UserInfo];
    } else {
      this.defaultData[KnownEventDataKeys.UserInfo] = userInfo;
    }

    this.log.info(
      `user identity: ${shouldRemove ? "null" : userInfo.identity}`,
    );
  }

  /**
   * Used to identify the client that sent the events to the server.
   * @returns {string}
   */
  public get userAgent(): string {
    return "exceptionless-js/1.0.0.0";
  }

  /**
   * Automatically send a heartbeat to keep the session alive.
   */
  public useSessions(
    sendHeartbeats: boolean = true,
    heartbeatInterval: number = 30000,
  ): void {
    if (sendHeartbeats) {
      this.addPlugin(new HeartbeatPlugin(heartbeatInterval));
    }
  }

  /**
   * Automatically set a reference id for error events.
   */
  public useReferenceIds(): void {
    this.addPlugin(new ReferenceIdPlugin());
  }

  // TODO: Support a min log level.
  public useDebugLogger(): void {
    this.log = new ConsoleLog();
  }

  public onChanged(handler: (config: Configuration) => void): void {
    handler && this._handlers.push(handler);
  }

  protected changed() {
    const handlers = this._handlers; // optimization for minifier.
    for (const handler of handlers) {
      try {
        handler(this);
      } catch (ex) {
        this.log.error(`Error calling onChanged handler: ${ex}`);
      }
    }
  }
}
