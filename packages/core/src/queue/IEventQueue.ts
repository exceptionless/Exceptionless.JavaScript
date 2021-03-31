import { Event } from "../models/Event.js";
import { Response } from "../submission/Response.js";

export interface IEventQueue {
  /** Enqueue an event and resumes any queue timers */
  enqueue(event: Event): void;
  /** Processes all events in the queue and resumes any queue timers */
  process(): Promise<void>;
  /** Suspends queue timers */
  suspend(): Promise<void>;
  /** Suspends processing of events for a specific duration */
  suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
  // TODO: See if this makes sense.
  onEventsPosted(handler: (events: Event[], response: Response) => void): void;
}
