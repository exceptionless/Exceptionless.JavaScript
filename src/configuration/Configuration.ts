import { IConfigurationSettings } from 'IConfigurationSettings';
import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { InMemoryLastReferenceIdManager } from '../lastReferenceIdManager/InMemoryLastReferenceIdManager';
import { ConsoleLog } from '../logging/ConsoleLog';
import { ILog } from '../logging/ILog';
import { NullLog } from '../logging/NullLog';
import { IEventPlugin } from '../plugins/IEventPlugin';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { EventPluginManager } from '../plugins/EventPluginManager';
import { ReferenceIdPlugin } from '../plugins/default/ReferenceIdPlugin';
import { IEventQueue } from '../queue/IEventQueue';
import { DefaultEventQueue } from '../queue/DefaultEventQueue';
import { IStorage } from '../storage/IStorage';
import { InMemoryStorage } from '../storage/InMemoryStorage';
import { ISubmissionClient } from '../submission/ISubmissionClient';
import { Utils } from '../Utils';

export class Configuration implements IConfigurationSettings {
  private _apiKey:string;
  private _enabled:boolean = false;
  private _serverUrl:string = 'https://collector.exceptionless.io';
  private _plugins:IEventPlugin[] = [];

  public lastReferenceIdManager:ILastReferenceIdManager = new InMemoryLastReferenceIdManager();
  public log:ILog;
  public submissionBatchSize;
  public submissionClient:ISubmissionClient;
  public storage:IStorage<any>;
  public queue:IEventQueue;
  public defaultTags:string[] = [];
  public defaultData:Object = {};

  constructor(settings?:IConfigurationSettings) {
    function inject(fn:any) {
      return typeof fn === 'function' ? fn(this) : fn;
    }

    settings = Utils.merge(Configuration.defaults, settings);

    this.apiKey = settings.apiKey;
    this.serverUrl = settings.serverUrl;
    this.lastReferenceIdManager = inject(settings.lastReferenceIdManager) || new InMemoryLastReferenceIdManager();
    this.log = inject(settings.log) || new NullLog();
    this.submissionBatchSize = inject(settings.submissionBatchSize) || 50;
    this.submissionClient = inject(settings.submissionClient);
    this.storage = inject(settings.storage) || new InMemoryStorage<any>();
    this.queue = inject(settings.queue) || new DefaultEventQueue(this);

    EventPluginManager.addDefaultPlugins(this);
  }

  public get apiKey(): string {
    return this._apiKey;
  }

  public set apiKey(value:string) {
    this._apiKey = value || null;
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

  public setVersion(version:string): void {
    if (!!version && version.length > 0) {
      this.defaultData['@version'] = version;
    }
  }

  public useReferenceIds(): void {
    this.addPlugin(new ReferenceIdPlugin());
  }

  // TODO: Support a min log level.
  public useDebugLogger(): void {
    this.log = new ConsoleLog();
  }

  private static _defaultSettings:IConfigurationSettings = null;
  public static get defaults() {
    if(Configuration._defaultSettings === null) {
      Configuration._defaultSettings = {};
    }

    return Configuration._defaultSettings;
  }
}
