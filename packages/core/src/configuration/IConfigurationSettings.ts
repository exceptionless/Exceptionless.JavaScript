import { ILastReferenceIdManager } from "../lastReferenceIdManager/ILastReferenceIdManager.js";
import { ILog } from "../logging/ILog.js";
import { IEventQueue } from "../queue/IEventQueue.js";
import { IEnvironmentInfoCollector } from "../services/IEnvironmentInfoCollector.js";
import { IErrorParser } from "../services/IErrorParser.js";
import { IModuleCollector } from "../services/IModuleCollector.js";
import { IRequestInfoCollector } from "../services/IRequestInfoCollector.js";
import { IStorageProvider } from "../storage/IStorageProvider.js";
import { ISubmissionClient } from "../submission/ISubmissionClient.js";
import { Configuration } from "./Configuration.js";

export interface IConfigurationSettings {
  apiKey?: string;
  serverUrl?: string;
  configServerUrl?: string;
  heartbeatServerUrl?: string;
  updateSettingsWhenIdleInterval?: number;
  includePrivateInformation?: boolean;
  environmentInfoCollector?: IEnvironmentInfoCollector | ((config: Configuration) => IEnvironmentInfoCollector);
  errorParser?: IErrorParser | ((config: Configuration) => IErrorParser);
  lastReferenceIdManager?: ILastReferenceIdManager | ((config: Configuration) => ILastReferenceIdManager);
  log?: ILog | ((config: Configuration) => ILog);
  moduleCollector?: IModuleCollector | ((config: Configuration) => IModuleCollector);
  requestInfoCollector?: IRequestInfoCollector | ((config: Configuration) => IRequestInfoCollector);
  submissionBatchSize?: number;
  submissionClient?: ISubmissionClient | ((config: Configuration) => ISubmissionClient);
  storage?: IStorageProvider | ((config: Configuration) => IStorageProvider);
  queue?: IEventQueue | ((config: Configuration) => IEventQueue);
}
