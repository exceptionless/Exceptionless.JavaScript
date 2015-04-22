/// <reference path="../references.ts" />

module Exceptionless {
  export interface IConfigurationSettings {
    apiKey?:string;
    serverUrl?:string;
    lastReferenceIdManager?:ILastReferenceIdManager;
    log?:ILog;
    submissionBatchSize?:number;
    submissionClient?:ISubmissionClient;
    storage?:IStorage<any>;
    queue?:IEventQueue;
  }
}
