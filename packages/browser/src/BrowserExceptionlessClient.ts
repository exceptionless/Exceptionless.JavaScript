import { ExceptionlessClient } from "@exceptionless/core";

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
}
