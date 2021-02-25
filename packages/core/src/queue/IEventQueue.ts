import { IEvent } from '../models/IEvent.js';
import { Response } from "../submission/Response.js";

export interface IEventQueue {
  enqueue(event: IEvent): void;
  process(): void;
  suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
  // TODO: See if this makes sense.
  onEventsPosted(handler: (events: IEvent[], response: Response<void>) => void): void;
}
