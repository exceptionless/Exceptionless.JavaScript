import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { ILog } from '../logging/ILog';
import { IEventQueue } from '../queue/IEventQueue';
import { IEnvironmentInfoCollector } from '../services/IEnvironmentInfoCollector';
import { IErrorParser } from '../services/IErrorParser';
import { IModuleCollector } from '../services/IModuleCollector';
import { IRequestInfoCollector } from '../services/IRequestInfoCollector';
import { IStorage } from '../storage/IStorage';
import { ISubmissionClient } from '../submission/ISubmissionClient';

export interface IConfigurationSettings {
  apiKey?:string;
  serverUrl?:string;
  environmentInfoCollector?:IEnvironmentInfoCollector;
  errorParser?:IErrorParser;
  lastReferenceIdManager?:ILastReferenceIdManager;
  log?:ILog;
  moduleCollector?:IModuleCollector;
  requestInfoCollector?:IRequestInfoCollector;
  submissionBatchSize?:number;
  submissionClient?:ISubmissionClient;
  storage?:IStorage<any>;
  queue?:IEventQueue;
}
