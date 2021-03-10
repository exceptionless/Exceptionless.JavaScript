import {
  IConfigurationSettings,
  Configuration,
  SettingsManager,
  parseQueryString
} from "@exceptionless/core";

import { DefaultErrorParser } from "./services/DefaultErrorParser.js";
import { DefaultModuleCollector } from "./services/DefaultModuleCollector.js";
import { DefaultRequestInfoCollector } from "./services/DefaultRequestInfoCollector.js";
import { BrowserStorage } from "./storage/BrowserStorage.js";
import { BrowserStorageProvider } from "./storage/BrowserStorageProvider.js";
import { FetchSubmissionClient } from "./submission/FetchSubmissionClient.js";

function getDefaultsSettingsFromScriptTag(): IConfigurationSettings {
  if (!document || !document.getElementsByTagName) {
    return null;
  }

  const scripts = document.getElementsByTagName("script");
  for (let index = 0; index < scripts.length; index++) {
    if (scripts[index].src?.includes("/exceptionless")) {
      return parseQueryString(scripts[index].src.split("?").pop());
    }
  }
  return null;
}

// TODO: Do we want to keep this?
Configuration.prototype.useLocalStorage = function() {
  if (BrowserStorage.isAvailable()) {
    this.storage = new BrowserStorageProvider();
    SettingsManager.applySavedServerSettings(this);
    this.changed();
  }
};

const defaults = Configuration.defaults;
const settings = getDefaultsSettingsFromScriptTag();
if (settings) {
  if (settings.apiKey) {
    defaults.apiKey = settings.apiKey;
  }

  if (settings.serverUrl) {
    defaults.serverUrl = settings.serverUrl;
  }

  if (typeof settings.includePrivateInformation === "string") {
    defaults.includePrivateInformation = settings.includePrivateInformation === "false" ? false : true;
  }
}

defaults.errorParser = new DefaultErrorParser();
defaults.moduleCollector = new DefaultModuleCollector();
defaults.requestInfoCollector = new DefaultRequestInfoCollector();
defaults.submissionClient = (config: Configuration) => new FetchSubmissionClient(config);

if (typeof document === "undefined") {
  //return;
}

//function processUnhandledException(stackTrace: TraceKit.StackTrace, options?: any): void {
//  const builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || (options || {}).status || "Script error"), "onerror");
//  builder.pluginContextData["@@_TraceKit.StackTrace"] = stackTrace;
//  builder.submit();
//}

/*
  TODO: We currently are unable to parse string exceptions.
  function processJQueryAjaxError(event, xhr, settings, error:string): void {
  let client = ExceptionlessClient.default;
  if (xhr.status === 404) {
  client.submitNotFound(settings.url);
  } else if (xhr.status !== 401) {
  client.createUnhandledException(error, "JQuery.ajaxError")
  .setSource(settings.url)
  .setProperty("status", xhr.status)
  .setProperty("request", settings.data)
  .setProperty("response", xhr.responseText && xhr.responseText.slice && xhr.responseText.slice(0, 1024))
  .submit();
  }
  }
  */

//TraceKit.report.subscribe(processUnhandledException);
//TraceKit.extendToAsynchronousCallbacks();

// window && window.addEventListener && window.addEventListener("beforeunload", function () {
//   ExceptionlessClient.default.config.queue.process(true);
// });

// if (typeof $ !== "undefined" && $(document)) {
//   $(document).ajaxError(processJQueryAjaxError);
// }

//(Error as any).stackTraceLimit = Infinity;
//declare var $;

// browser plugin startup method wires up all handlers?

// TODO: Export all services
export { Exceptionless } from "@exceptionless/core";
