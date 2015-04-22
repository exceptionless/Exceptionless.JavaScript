/// <reference path="../references.ts" />

module Exceptionless {
  export class EventPluginContext {
    public client:ExceptionlessClient;
    public event:IEvent;
    public contextData:ContextData;
    public cancel:boolean = false;

    constructor(client:ExceptionlessClient, event:IEvent, contextData?:ContextData) {
      this.client = client;
      this.event = event;
      this.contextData = contextData ? contextData : new ContextData();
    }

    public get log(): ILog {
      return this.client.config.log;
    }
  }
}
