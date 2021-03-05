export { Configuration } from "./configuration/Configuration.js";
export { IConfigurationSettings } from "./configuration/IConfigurationSettings.js";
export { SettingsManager } from "./configuration/SettingsManager.js";

export { DefaultLastReferenceIdManager } from "./lastReferenceIdManager/DefaultLastReferenceIdManager.js";
export { ILastReferenceIdManager } from "./lastReferenceIdManager/ILastReferenceIdManager.js";

export { ILog } from "./logging/ILog.js";
export { ConsoleLog } from "./logging/ConsoleLog.js";
export { NullLog } from "./logging/NullLog.js";

export { Event, KnownEventDataKeys } from "./models/Event.js";
export { EnvironmentInfo } from "./models/data/EnvironmentInfo.js";
export { ManualStackingInfo } from "./models/data/ManualStackingInfo.js";
export { RequestInfo } from "./models/data/RequestInfo.js";
export { UserDescription } from "./models/data/UserDescription.js";
export { UserInfo } from "./models/data/UserInfo.js";
export { ModuleInfo } from "./models/data/ModuleInfo.js";

export {
  ErrorInfo,
  InnerErrorInfo,
  MethodInfo,
  ParameterInfo,
  StackFrameInfo,
} from "./models/data/ErrorInfo.js";

export { ConfigurationDefaultsPlugin } from "./plugins/default/ConfigurationDefaultsPlugin.js";
export { DuplicateCheckerPlugin } from "./plugins/default/DuplicateCheckerPlugin.js";
export { EnvironmentInfoPlugin } from "./plugins/default/EnvironmentInfoPlugin.js";
export { ErrorPlugin } from "./plugins/default/ErrorPlugin.js";
export { EventExclusionPlugin } from "./plugins/default/EventExclusionPlugin.js";
export { HeartbeatPlugin } from "./plugins/default/HeartbeatPlugin.js";
export { ModuleInfoPlugin } from "./plugins/default/ModuleInfoPlugin.js";
export { ReferenceIdPlugin } from "./plugins/default/ReferenceIdPlugin.js";
export { RequestInfoPlugin } from "./plugins/default/RequestInfoPlugin.js";
export { SubmissionMethodPlugin } from "./plugins/default/SubmissionMethodPlugin.js";
export { ContextData } from "./plugins/ContextData.js";
export { EventPluginContext } from "./plugins/EventPluginContext.js";
export { EventPluginManager } from "./plugins/EventPluginManager.js";
export { IEventPlugin } from "./plugins/IEventPlugin.js";

export { DefaultEventQueue } from "./queue/DefaultEventQueue.js";
export { IEventQueue } from "./queue/IEventQueue.js";

export { IEnvironmentInfoCollector } from "./services/IEnvironmentInfoCollector.js";
export { IErrorParser } from "./services/IErrorParser.js";
export { IModuleCollector } from "./services/IModuleCollector.js";
export { IRequestInfoCollector } from "./services/IRequestInfoCollector.js";

export { InMemoryStorage } from "./storage/InMemoryStorage.js";
export { InMemoryStorageProvider } from "./storage/InMemoryStorageProvider.js";
export { IStorage } from "./storage/IStorage.js";
export { IStorageItem } from "./storage/IStorageItem.js";
export { IStorageProvider } from "./storage/IStorageProvider.js";
export { KeyValueStorageBase } from "./storage/KeyValueStorageBase.js";

export { ISubmissionClient } from "./submission/ISubmissionClient.js";
export { Response } from "./submission/Response.js";
export {
  FetchOptions,
  SubmissionClientBase,
} from "./submission/SubmissionClientBase.js";

export { EventBuilder } from "./EventBuilder.js";
export { ExceptionlessClient } from "./ExceptionlessClient.js";

import { ExceptionlessClient } from "./ExceptionlessClient.js";
export const Exceptionless = new ExceptionlessClient();

export {
  endsWith,
  getCookies,
  getHashCode,
  guid,
  isEmpty,
  isMatch,
  merge,
  parseQueryString,
  parseVersion,
  randomNumber,
  startsWith,
  stringify,
  toBoolean,
} from "./Utils.js";
