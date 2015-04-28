import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { ILog } from '../logging/ILog';
import { IEventQueue } from '../queue/IEventQueue';
import { IStorage } from '../storage/IStorage';
import { ISubmissionClient } from '../submission/ISubmissionClient';

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
