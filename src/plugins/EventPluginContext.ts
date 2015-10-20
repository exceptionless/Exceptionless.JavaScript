import { ContextData } from './ContextData';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { IEvent } from '../models/IEvent';
import { ILog } from '../logging/ILog';

export class EventPluginContext {
  public cancelled:boolean;
  public client:ExceptionlessClient;
  public event:IEvent;
  public contextData:ContextData;

  constructor(client:ExceptionlessClient, event:IEvent, contextData?:ContextData) {
    this.client = client;
    this.event = event;
    this.contextData = contextData ? contextData : new ContextData();
  }

  public get log(): ILog {
    return this.client.config.log;
  }
}
