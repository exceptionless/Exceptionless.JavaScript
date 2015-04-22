/// <reference path="../references.ts" />

module Exceptionless {
  export class InMemoryLastReferenceIdManager implements ILastReferenceIdManager {
    private _lastReferenceId:string = null;

    getLast(): string {
      return this._lastReferenceId;
    }

    clearLast():void {
      this._lastReferenceId = null;
    }

    setLast(eventId:string):void {
      this._lastReferenceId = eventId;
    }
  }
}
