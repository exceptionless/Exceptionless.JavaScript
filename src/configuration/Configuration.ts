import { IConfigurationSettings } from './IConfigurationSettings';
import { SettingsManager } from './SettingsManager';
import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { DefaultLastReferenceIdManager } from '../lastReferenceIdManager/DefaultLastReferenceIdManager';
import { ConsoleLog } from '../logging/ConsoleLog';
import { ILog } from '../logging/ILog';
import { NullLog } from '../logging/NullLog';
import { IUserInfo } from '../models/IUserInfo';
import { IEventPlugin } from '../plugins/IEventPlugin';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { EventPluginManager } from '../plugins/EventPluginManager';
import { HeartbeatPlugin } from '../plugins/default/HeartbeatPlugin';
import { ReferenceIdPlugin } from '../plugins/default/ReferenceIdPlugin';
import { IEventQueue } from '../queue/IEventQueue';
import { DefaultEventQueue } from '../queue/DefaultEventQueue';
import { IEnvironmentInfoCollector } from '../services/IEnvironmentInfoCollector';
import { IErrorParser } from '../services/IErrorParser';
import { IModuleCollector } from '../services/IModuleCollector';
import { IRequestInfoCollector } from '../services/IRequestInfoCollector';
import { IStorage } from '../storage/IStorage';
import { InMemoryStorage } from '../storage/InMemoryStorage';
import { ISubmissionAdapter } from '../submission/ISubmissionAdapter';
import { ISubmissionClient } from '../submission/ISubmissionClient';
import { DefaultSubmissionClient } from '../submission/DefaultSubmissionClient';
import { Utils } from '../Utils';

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
  public defaultData: Object = {};

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
  public settings: Object = {};

  public storage: IStorage;

  public queue: IEventQueue;

  /**
   * The list of plugins that will be used in this configuration.
   * @type {Array}
   * @private
   */
  private _plugins: IEventPlugin[] = [];

  constructor(configSettings?: IConfigurationSettings) {
    function inject(fn: any) {
      return typeof fn === 'function' ? fn(this) : fn;
    }

    configSettings = Utils.merge(Configuration.defaults, configSettings);

    this.log = inject(configSettings.log) || new NullLog();
    this.apiKey = configSettings.apiKey;
    this.serverUrl = configSettings.serverUrl;

    this.environmentInfoCollector = inject(configSettings.environmentInfoCollector);
    this.errorParser = inject(configSettings.errorParser);
    this.lastReferenceIdManager = inject(configSettings.lastReferenceIdManager) || new DefaultLastReferenceIdManager();
    this.moduleCollector = inject(configSettings.moduleCollector);
    this.requestInfoCollector = inject(configSettings.requestInfoCollector);
    this.submissionBatchSize = inject(configSettings.submissionBatchSize) || 50;
    this.submissionAdapter = inject(configSettings.submissionAdapter);
    this.submissionClient = inject(configSettings.submissionClient) || new DefaultSubmissionClient();
    this.storage = inject(configSettings.storage) || new InMemoryStorage();
    this.queue = inject(configSettings.queue) || new DefaultEventQueue(this);

    SettingsManager.applySavedServerSettings(this);
    EventPluginManager.addDefaultPlugins(this);
  }

  /**
   * The API key that will be used when sending events to the server.
   * @type {string}
   * @private
   */
  private _apiKey: string;

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
   * @type {string}
   * @private
   */
  private _serverUrl: string = 'https://collector.exceptionless.io';

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
      this.log.info(`serverUrl: ${this._serverUrl}`);
    }
  }

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
   *  A list of exclusion patterns that will automatically remove any data that
   *  matches them from any data submitted to the server.
   *
   *  For example, entering CreditCard will remove any extended data properties,
   *  form fields, cookies and query parameters from the report.
   *
   * @returns {string[]}
   */
  public get dataExclusions(): string[] {
    let exclusions: string = this.settings['@@DataExclusions'];
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
    let patterns: string = this.settings['@@UserAgentBotPatterns'];
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
    let plugin: IEventPlugin = !!pluginAction ? { name: <string>pluginOrName, priority: priority, run: pluginAction } : <IEventPlugin>pluginOrName;
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
    let plugins = this._plugins; // optimization for minifier.
    for (let index = 0; index < plugins.length; index++) {
      if (plugins[index].name === plugin.name) {
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
  public removePlugin(name: string): void;
  public removePlugin(pluginOrName: IEventPlugin | string): void {
    let name: string = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
    if (!name) {
      this.log.error('Remove plugin failed: Plugin name not defined');
      return;
    }

    let plugins = this._plugins; // optimization for minifier.
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
    let userInfo: IUserInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };

    let shouldRemove: boolean = !userInfo || (!userInfo.identity && !userInfo.name);
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
  public useSessions(sendHeartbeats: boolean = true): void {
    if (sendHeartbeats) {
      this.addPlugin(new HeartbeatPlugin());
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
