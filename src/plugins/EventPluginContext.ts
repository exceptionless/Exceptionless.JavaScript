import { ContextData } from './ContextData';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { IEvent } from '../models/IEvent';
import { IEventPlugin } from './IEventPlugin';
import { ILog } from '../logging/ILog';

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
