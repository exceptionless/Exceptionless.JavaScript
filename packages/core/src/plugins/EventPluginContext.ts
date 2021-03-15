import { ExceptionlessClient } from "../ExceptionlessClient.js";
import { ILog } from "../logging/ILog.js";
import { Event } from "../models/Event.js";
import { ContextData } from "./ContextData.js";
import { PluginContext } from "./PluginContext.js";

export class EventPluginContext extends PluginContext {
  constructor(
    client: ExceptionlessClient,
    public event: Event,
    public contextData: ContextData = new ContextData()
  ) {
    super(client);
  }

  public get log(): ILog {
    return this.client.config.log;
  }
}
