import { IEvent } from '../models/IEvent';
import { SubmissionResponse } from '../submission/SubmissionResponse';

export interface IEventQueue {
  enqueue(event: IEvent): void;
  process(isAppExiting?: boolean): void;
  suspendProcessing(durationInMinutes?: number, discardFutureQueuedItems?: boolean, clearQueue?: boolean): void;
  onEventsPosted(handler: (events: IEvent[], response: SubmissionResponse) => void): void;
}
