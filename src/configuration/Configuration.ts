import { DefaultLastReferenceIdManager } from '../lastReferenceIdManager/DefaultLastReferenceIdManager';
import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { ConsoleLog } from '../logging/ConsoleLog';
import { ILog } from '../logging/ILog';
import { NullLog } from '../logging/NullLog';
import { IUserInfo } from '../models/IUserInfo';
import { HeartbeatPlugin } from '../plugins/default/HeartbeatPlugin';
import { ReferenceIdPlugin } from '../plugins/default/ReferenceIdPlugin';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { EventPluginManager } from '../plugins/EventPluginManager';
import { IEventPlugin } from '../plugins/IEventPlugin';
import { DefaultEventQueue } from '../queue/DefaultEventQueue';
import { IEventQueue } from '../queue/IEventQueue';
import { IEnvironmentInfoCollector } from '../services/IEnvironmentInfoCollector';
import { IErrorParser } from '../services/IErrorParser';
import { IModuleCollector } from '../services/IModuleCollector';
import { IRequestInfoCollector } from '../services/IRequestInfoCollector';
import { InMemoryStorageProvider } from '../storage/InMemoryStorageProvider';
import { IStorageProvider } from '../storage/IStorageProvider';
import { DefaultSubmissionClient } from '../submission/DefaultSubmissionClient';
import { ISubmissionAdapter } from '../submission/ISubmissionAdapter';
import { ISubmissionClient } from '../submission/ISubmissionClient';
import { Utils } from '../Utils';
import { IConfigurationSettings } from './IConfigurationSettings';
import { SettingsManager } from './SettingsManager';

export class Configuration implements IConfigurationSettings {
  /**
   * The default configuration settings that are applied to new configuration instances.
   * @type {IConfigurationSettings}
   * @private
   */
  private static _defaultSettings: IConfigurationSettings = null;

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
  public defaultData: object = {};

  /**
   * Whether the client is currently enabled or not. If it is disabled,
   * submitted errors will be discarded and no data will be sent to the server.
   *
   * @returns {boolean}
   */
  public enabled: boolean = true;

  public environmentInfoCollector: IEnvironmentInfoCollector;
  public errorParser: IErrorParser;
  public lastReferenceIdManager: ILastReferenceIdManager = new DefaultLastReferenceIdManager();
  public log: ILog;
  public moduleCollector: IModuleCollector;
  public requestInfoCollector: IRequestInfoCollector;

  /**
   * Maximum number of events that should be sent to the server together in a batch. (Defaults to 50)
   */
  public submissionBatchSize: number;
  public submissionAdapter: ISubmissionAdapter;
  public submissionClient: ISubmissionClient;

  /**
   * Contains a dictionary of custom settings that can be used to control
   * the client and will be automatically updated from the server.
   */
  public settings: object = {};

  public storage: IStorageProvider;

  public queue: IEventQueue;

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
  private _serverUrl: string = 'https://collector.exceptionless.io';

  /**
   * The heartbeat server url that all heartbeats will be sent to.
   * @type {string}
   * @private
   */
  private _heartbeatServerUrl: string = 'https://heartbeat.exceptionless.io';

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

  constructor(configSettings?: IConfigurationSettings) {
    function inject(fn: any) {
      return typeof fn === 'function' ? fn(this) : fn;
    }

    configSettings = Utils.merge(Configuration.defaults, configSettings);

    this.log = inject(configSettings.log) || new NullLog();
    this.apiKey = configSettings.apiKey;
    this.serverUrl = configSettings.serverUrl;
    this.heartbeatServerUrl = configSettings.heartbeatServerUrl;
    this.updateSettingsWhenIdleInterval = configSettings.updateSettingsWhenIdleInterval;

    this.environmentInfoCollector = inject(configSettings.environmentInfoCollector);
    this.errorParser = inject(configSettings.errorParser);
    this.lastReferenceIdManager = inject(configSettings.lastReferenceIdManager) || new DefaultLastReferenceIdManager();
    this.moduleCollector = inject(configSettings.moduleCollector);
    this.requestInfoCollector = inject(configSettings.requestInfoCollector);
    this.submissionBatchSize = inject(configSettings.submissionBatchSize) || 50;
    this.submissionAdapter = inject(configSettings.submissionAdapter);
    this.submissionClient = inject(configSettings.submissionClient) || new DefaultSubmissionClient();
    this.storage = inject(configSettings.storage) || new InMemoryStorageProvider();
    this.queue = inject(configSettings.queue) || new DefaultEventQueue(this);

    SettingsManager.applySavedServerSettings(this);
    EventPluginManager.addDefaultPlugins(this);
  }

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
    return !!this.apiKey && this.apiKey.length >= 10;
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
    if (!!value) {
      this._serverUrl = value;
      this._heartbeatServerUrl = value;
      this.log.info(`serverUrl: ${value}`);
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
    if (!!value) {
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
    if (typeof value !== 'number') {
      return;
    }

    if (value <= 0) {
      value = -1;
    } else if (value > 0 && value < 15000) {
      value = 15000;
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
    const exclusions: string = this.settings['@@DataExclusions'];
    return this._dataExclusions.concat(exclusions && exclusions.split(',') || []);
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
    this._dataExclusions = Utils.addRange<string>(this._dataExclusions, ...exclusions);
  }

  /**
   * A list of user agent patterns that will cause any event with a matching user agent to not be submitted.
   *
   * For example, entering *Bot* will cause any events that contains a user agent of Bot will not be submitted.
   *
   * @returns {string[]}
   */
  public get userAgentBotPatterns(): string[] {
    const patterns: string = this.settings['@@UserAgentBotPatterns'];
    return this._userAgentBotPatterns.concat(patterns && patterns.split(',') || []);
  }

  /**
   * Add items to the list of user agent patterns that will cause any event with a matching user agent to not be submitted.
   *
   * For example, entering *Bot* will cause any events that contains a user agent of Bot will not be submitted.
   *
   * @param userAgentBotPatterns
   */
  public addUserAgentBotPatterns(...userAgentBotPatterns: string[]) {
    this._userAgentBotPatterns = Utils.addRange<string>(this._userAgentBotPatterns, ...userAgentBotPatterns);
  }

  /**
   * The list of plugins that will be used in this configuration.
   * @returns {IEventPlugin[]}
   */
  public get plugins(): IEventPlugin[] {
    return this._plugins.sort((p1: IEventPlugin, p2: IEventPlugin) => {
      return (p1.priority < p2.priority) ? -1 : (p1.priority > p2.priority) ? 1 : 0;
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
  public addPlugin(name: string, priority: number, pluginAction: (context: EventPluginContext, next?: () => void) => void): void;
  public addPlugin(pluginOrName: IEventPlugin | string, priority?: number, pluginAction?: (context: EventPluginContext, next?: () => void) => void): void {
    const plugin: IEventPlugin = !!pluginAction ? { name: pluginOrName as string, priority, run: pluginAction } :  pluginOrName as IEventPlugin;
    if (!plugin || !plugin.run) {
      this.log.error('Add plugin failed: Run method not defined');
      return;
    }

    if (!plugin.name) {
      plugin.name = Utils.guid();
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
    const name: string = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
    if (!name) {
      this.log.error('Remove plugin failed: Plugin name not defined');
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
    if (!!version) {
      this.defaultData['@version'] = version;
    }
  }

  public setUserIdentity(userInfo: IUserInfo): void;
  public setUserIdentity(identity: string): void;
  public setUserIdentity(identity: string, name: string): void;
  public setUserIdentity(userInfoOrIdentity: IUserInfo | string, name?: string): void {
    const USER_KEY: string = '@user'; // optimization for minifier.
    const userInfo: IUserInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name };

    const shouldRemove: boolean = !userInfo || (!userInfo.identity && !userInfo.name);
    if (shouldRemove) {
      delete this.defaultData[USER_KEY];
    } else {
      this.defaultData[USER_KEY] = userInfo;
    }

    this.log.info(`user identity: ${shouldRemove ? 'null' : userInfo.identity}`);
  }

  /**
   * Used to identify the client that sent the events to the server.
   * @returns {string}
   */
  public get userAgent(): string {
    return 'exceptionless-js/1.0.0.0';
  }

  /**
   * Automatically send a heartbeat to keep the session alive.
   */
  public useSessions(sendHeartbeats: boolean = true, heartbeatInterval: number = 30000): void {
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

  public useLocalStorage(): void {
    // This method will be injected via the prototype.
  }

  // TODO: Support a min log level.
  public useDebugLogger(): void {
    this.log = new ConsoleLog();
  }

  public onChanged(handler: (config: Configuration) => void) {
    !!handler && this._handlers.push(handler);
  }

  private changed() {
    const handlers = this._handlers; // optimization for minifier.
    for (const handler of handlers) {
      try {
        handler(this);
      } catch (ex) {
        this.log.error(`Error calling onChanged handler: ${ex}`);
      }
    }
  }

  /**
   * The default configuration settings that are applied to new configuration instances.
   * @returns {IConfigurationSettings}
   */
  public static get defaults() {
    if (Configuration._defaultSettings === null) {
      Configuration._defaultSettings = {};
    }

    return Configuration._defaultSettings;
  }
}
