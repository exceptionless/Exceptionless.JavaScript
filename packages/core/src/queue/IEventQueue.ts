import { Event } from "../models/Event.js";
import { Response } from "../submission/Response.js";

export interface IEventQueue {
  enqueue(event: Event): void;
  process(): Promise<void>;
  suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
  // TODO: See if this makes sense.
  onEventsPosted(handler: (events: Event[], response: Response<void>) => void): void;
}
