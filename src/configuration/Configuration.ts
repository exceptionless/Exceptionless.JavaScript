/// <reference path="../references.ts" />

module Exceptionless {
  export class Configuration {
    private _apiKey:string;
    private _enabled:boolean = false;
    private _serverUrl:string = 'https://collector.exceptionless.io';
    private _plugins:IEventPlugin[] = [];

    public lastReferenceIdManager:ILastReferenceIdManager = new InMemoryLastReferenceIdManager();
    public log:ILog = new NullLog();
    public submissionBatchSize = 50;
    public submissionClient:ISubmissionClient = new DefaultSubmissionClient();
    public storage:IStorage<any> = new InMemoryStorage<any>();
    public queue:IEventQueue;
    public defaultTags:string[] = [];
    public defaultData:Object = {};

    constructor(apiKey:string, serverUrl?:string) {
      this.apiKey = apiKey;
      this.serverUrl = serverUrl;
      this.queue = new DefaultEventQueue(this);

      EventPluginManager.addDefaultPlugins(this);
    }

    public get apiKey(): string {
      return this._apiKey;
    }

    public set apiKey(value:string) {
      this._apiKey = value;
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

    public useReferenceIds(): void {
      this.addPlugin(new ReferenceIdPlugin());
    }
  }
}
