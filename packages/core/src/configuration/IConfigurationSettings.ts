import { ILastReferenceIdManager } from "../lastReferenceIdManager/ILastReferenceIdManager.js";
import { ILog } from "../logging/ILog.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { IEnvironmentInfoCollector } from "../services/IEnvironmentInfoCollector.js";
import { IErrorParser } from "../services/IErrorParser.js";
import { IModuleCollector } from "../services/IModuleCollector.js";
import { IRequestInfoCollector } from "../services/IRequestInfoCollector.js";
import { IStorageProvider } from "../storage/IStorageProvider.js";
import { ISubmissionClient } from "../submission/ISubmissionClient.js";

export interface IConfigurationSettings {
  apiKey?: string;
  serverUrl?: string;
  configServerUrl?: string;
  heartbeatServerUrl?: string;
  updateSettingsWhenIdleInterval?: number;
  includePrivateInformation?: boolean;
  environmentInfoCollector?: IEnvironmentInfoCollector;
  errorParser?: IErrorParser;
  lastReferenceIdManager?: ILastReferenceIdManager;
  log?: ILog;
  moduleCollector?: IModuleCollector;
  requestInfoCollector?: IRequestInfoCollector;
  submissionBatchSize?: number;
  submissionClient?: ISubmissionClient;
  storage?: IStorageProvider;
  queue?: IEventQueue;
}
