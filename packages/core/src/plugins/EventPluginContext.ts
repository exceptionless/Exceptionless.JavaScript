import { ExceptionlessClient } from "../ExceptionlessClient.js";
import { ILog } from "../logging/ILog.js";
import { Event } from "../models/Event.js";
import { ContextData } from "./ContextData.js";

export class EventPluginContext {
  public cancelled: boolean = false;
  public client: ExceptionlessClient;
  public event: Event;
  public contextData: ContextData;

  constructor(
    client: ExceptionlessClient,
    event: Event,
    contextData?: ContextData,
  ) {
    this.client = client;
    this.event = event;
    this.contextData = contextData ? contextData : new ContextData();
  }

  public get log(): ILog {
    return this.client.config.log;
  }
}
