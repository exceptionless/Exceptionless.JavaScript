import {
  Configuration,
  ExceptionlessClient,
  parseQueryString
} from "@exceptionless/core";

import { BrowserConfiguration } from "./configuration/BrowserConfiguration.js";
import { BrowserErrorParser } from "./services/BrowserErrorParser.js";
import { BrowserModuleCollector } from "./services/BrowserModuleCollector.js";
import { BrowserRequestInfoCollector } from "./services/BrowserRequestInfoCollector.js";
import { BrowserFetchSubmissionClient } from "./submission/BrowserFetchSubmissionClient.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  constructor() {
    super(new BrowserConfiguration());
  }

  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    if (configurationOrApiKey) {
      const settings = this.getDefaultsSettingsFromScriptTag();
      if (settings?.apiKey) {
        this.config.apiKey = settings.apiKey;
      }

      if (settings?.serverUrl) {
        this.config.serverUrl = settings.serverUrl;
      }

      if (settings?.serverUrl) {
        this.config.serverUrl = settings.serverUrl;
      }

      if (settings?.includePrivateInformation) {
        this.config.includePrivateInformation = settings.includePrivateInformation === "true";
      }

      this.config.errorParser = new BrowserErrorParser();
      this.config.moduleCollector = new BrowserModuleCollector();
      this.config.requestInfoCollector = new BrowserRequestInfoCollector();
      this.config.submissionClient = new BrowserFetchSubmissionClient(this.config);

      // TODO: Register platform specific plugins.
    }

    await super.startup(configurationOrApiKey);
  }

  private getDefaultsSettingsFromScriptTag(): { [key: string]: string } {
    if (typeof document === "undefined" || !document || !document.getElementsByTagName) {
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
