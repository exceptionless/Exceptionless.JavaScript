import { ILastReferenceIdManager } from '../lastReferenceIdManager/ILastReferenceIdManager';
import { ILog } from '../logging/ILog';
import { IEventQueue } from '../queue/IEventQueue';
import { IEnvironmentInfoCollector } from '../services/IEnvironmentInfoCollector';
import { IErrorParser } from '../services/IErrorParser';
import { IModuleCollector } from '../services/IModuleCollector';
import { IRequestInfoCollector } from '../services/IRequestInfoCollector';
import { IStorageProvider } from '../storage/IStorageProvider';
import { ISubmissionAdapter } from '../submission/ISubmissionAdapter';
import { ISubmissionClient } from '../submission/ISubmissionClient';

export interface IConfigurationSettings {
  apiKey?: string;
  serverUrl?: string;
  heartbeatServerUrl?: string;
  updateSettingsWhenIdleInterval?: number;
  environmentInfoCollector?: IEnvironmentInfoCollector;
  errorParser?: IErrorParser;
  lastReferenceIdManager?: ILastReferenceIdManager;
  log?: ILog;
  moduleCollector?: IModuleCollector;
  requestInfoCollector?: IRequestInfoCollector;
  submissionBatchSize?: number;
  submissionClient?: ISubmissionClient;
  submissionAdapter?: ISubmissionAdapter;
  storage?: IStorageProvider;
  queue?: IEventQueue;
}
