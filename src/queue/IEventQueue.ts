/// <reference path="../references.ts" />

module Exceptionless {
  export interface IEventQueue {
    enqueue(event:IEvent);
    process();
    suspendProcessing(durationInMinutes?:number, discardFutureQueuedItems?:boolean, clearQueue?:boolean);
  }
}
