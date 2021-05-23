import { ExceptionlessClient } from "../ExceptionlessClient.js";
import { ILog } from "../logging/ILog.js";
import { Event } from "../models/Event.js";
import { EventContext } from "../models/EventContext.js";

export class EventPluginContext {
  public cancelled = false;

  constructor(public client: ExceptionlessClient, public event: Event, public eventContext: EventContext = null) {
    if (!this.eventContext)
      this.eventContext = new EventContext();
  }

  public get log(): ILog {
    return this.client.config.services.log;
  }
}
