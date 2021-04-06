import {
  Configuration,
  ExceptionlessClient
} from "@exceptionless/core";

import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";
import { BrowserErrorParser } from "./services/BrowserErrorParser.js";
import { BrowserModuleCollector } from "./services/BrowserModuleCollector.js";
import { BrowserRequestInfoCollector } from "./services/BrowserRequestInfoCollector.js";
import { BrowserLocalStorage } from "./storage/BrowserLocalStorage.js";
import { BrowserFetchSubmissionClient } from "./submission/BrowserFetchSubmissionClient.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey) {
      config.services.storage = new BrowserLocalStorage();
      config.services.errorParser = new BrowserErrorParser();
      config.services.moduleCollector = new BrowserModuleCollector();
      config.services.requestInfoCollector = new BrowserRequestInfoCollector();
      config.services.submissionClient = new BrowserFetchSubmissionClient(config);

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserWrapFunctions());
    }

    await super.startup(configurationOrApiKey);
  }
}
