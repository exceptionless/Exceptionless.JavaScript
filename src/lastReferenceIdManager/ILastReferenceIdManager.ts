/// <reference path="../references.ts" />

module Exceptionless {
  export interface ILastReferenceIdManager {
    getLast(): string;
    clearLast(): void;
    setLast(eventId:string): void;
  }
}
