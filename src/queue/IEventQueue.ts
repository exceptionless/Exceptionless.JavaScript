import { IEvent } from '../models/IEvent';

export interface IEventQueue {
  enqueue(event:IEvent);
  process();
  suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean);
}
