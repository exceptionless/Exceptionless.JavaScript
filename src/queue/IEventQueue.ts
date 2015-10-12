import { IEvent } from '../models/IEvent';

export interface IEventQueue {
  enqueue(event:IEvent):void;
  process(isAppExiting?:boolean):void;
  suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean):void;
}
