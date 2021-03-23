import {
  ExceptionlessClient,
  parseQueryString
} from "@exceptionless/core";

import { BrowserConfiguration } from "./configuration/BrowserConfiguration.js";
import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";
import { BrowserErrorParser } from "./services/BrowserErrorParser.js";
import { BrowserModuleCollector } from "./services/BrowserModuleCollector.js";
import { BrowserRequestInfoCollector } from "./services/BrowserRequestInfoCollector.js";
import { BrowserFetchSubmissionClient } from "./submission/BrowserFetchSubmissionClient.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  constructor() {
    super(new BrowserConfiguration());
  }

  public async startup(configurationOrApiKey?: (config: BrowserConfiguration) => void | string): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey) {
      const settings = this.getDefaultsSettingsFromScriptTag();
      if (settings?.apiKey) {
        config.apiKey = settings.apiKey;
      }

      if (settings?.serverUrl) {
        config.serverUrl = settings.serverUrl;
      }

      if (settings?.serverUrl) {
        config.serverUrl = settings.serverUrl;
      }

      if (settings?.includePrivateInformation) {
        config.includePrivateInformation = settings.includePrivateInformation === "true";
      }

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserWrapFunctions());

      config.services.errorParser = new BrowserErrorParser();
      config.services.moduleCollector = new BrowserModuleCollector();
      config.services.requestInfoCollector = new BrowserRequestInfoCollector();
      config.services.submissionClient = new BrowserFetchSubmissionClient(config);
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
