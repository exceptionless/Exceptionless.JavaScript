import {
  Configuration,
  ExceptionlessClient
} from "@exceptionless/core";

import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";
import { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
import { BrowserErrorParser } from "./services/BrowserErrorParser.js";
import { BrowserRequestInfoCollector } from "./services/BrowserRequestInfoCollector.js";
import { BrowserLocalStorage } from "./storage/BrowserLocalStorage.js";
import { BrowserFetchSubmissionClient } from "./submission/BrowserFetchSubmissionClient.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey) {
      config.services.storage = new BrowserLocalStorage();
      config.services.errorParser = new BrowserErrorParser();
      config.services.requestInfoCollector = new BrowserRequestInfoCollector();
      config.services.submissionClient = new BrowserFetchSubmissionClient(config);

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserWrapFunctions());
      config.addPlugin(new BrowserModuleInfoPlugin());
    }

    await super.startup(configurationOrApiKey);
  }
}
