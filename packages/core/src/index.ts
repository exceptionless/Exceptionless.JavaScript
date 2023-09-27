export { Configuration } from "./configuration/Configuration.js";
export { SettingsManager } from "./configuration/SettingsManager.js";

export { DefaultLastReferenceIdManager } from "./lastReferenceIdManager/DefaultLastReferenceIdManager.js";
export type { ILastReferenceIdManager } from "./lastReferenceIdManager/ILastReferenceIdManager.js";

export type { ILog } from "./logging/ILog.js";
export { ConsoleLog } from "./logging/ConsoleLog.js";
export { NullLog } from "./logging/NullLog.js";

export type { Event, EventType, IEventData, LogLevel } from "./models/Event.js";
export { KnownEventDataKeys } from "./models/Event.js";
export type { EnvironmentInfo } from "./models/data/EnvironmentInfo.js";
export type { ManualStackingInfo } from "./models/data/ManualStackingInfo.js";
export type { RequestInfo } from "./models/data/RequestInfo.js";
export type { UserDescription } from "./models/data/UserDescription.js";
export type { UserInfo } from "./models/data/UserInfo.js";
export type { ModuleInfo } from "./models/data/ModuleInfo.js";

export type {
  SimpleError,
  ErrorInfo,
  InnerErrorInfo,
  MethodInfo,
  ParameterInfo,
  StackFrameInfo,
} from "./models/data/ErrorInfo.js";

export { ConfigurationDefaultsPlugin } from "./plugins/default/ConfigurationDefaultsPlugin.js";
export { DuplicateCheckerPlugin } from "./plugins/default/DuplicateCheckerPlugin.js";
export { EventExclusionPlugin } from "./plugins/default/EventExclusionPlugin.js";
export { HeartbeatPlugin } from "./plugins/default/HeartbeatPlugin.js";
export { ReferenceIdPlugin } from "./plugins/default/ReferenceIdPlugin.js";
export { SessionIdManagementPlugin } from "./plugins/default/SessionIdManagementPlugin.js";
export { IgnoredErrorProperties, SimpleErrorPlugin } from "./plugins/default/SimpleErrorPlugin.js"
export { SubmissionMethodPlugin } from "./plugins/default/SubmissionMethodPlugin.js";
export { EventContext } from "./models/EventContext.js";
export { PluginContext } from "./plugins/PluginContext.js";
export { EventPluginContext } from "./plugins/EventPluginContext.js";
export { EventPluginManager } from "./plugins/EventPluginManager.js";
export type { IEventPlugin } from "./plugins/IEventPlugin.js";

export { DefaultEventQueue } from "./queue/DefaultEventQueue.js";
export type { IEventQueue } from "./queue/IEventQueue.js";

export { InMemoryStorage } from "./storage/InMemoryStorage.js";
export { LocalStorage } from "./storage/LocalStorage.js";
export type { IStorage } from "./storage/IStorage.js";

export type { ISubmissionClient } from "./submission/ISubmissionClient.js";
export { Response } from "./submission/Response.js";
export type { FetchOptions } from "./submission/DefaultSubmissionClient.js";
export { DefaultSubmissionClient } from "./submission/DefaultSubmissionClient.js";
export { EventBuilder } from "./EventBuilder.js";
export { ExceptionlessClient } from "./ExceptionlessClient.js";

export {
  endsWith,
  getCookies,
  getHashCode,
  guid,
  isEmpty,
  isMatch,
  parseQueryString,
  parseVersion,
  prune,
  randomNumber,
  startsWith,
  stringify,
  toBoolean,
  toError,
} from "./Utils.js";
