import { IEvent } from '../models/IEvent.js';
import { SubmissionResponse } from '../submission/SubmissionResponse.js';

export interface IEventQueue {
  enqueue(event: IEvent): void;
  process(isAppExiting?: boolean): void;
  suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
  onEventsPosted(handler: (events: IEvent[], response: SubmissionResponse) => void): void;
}
