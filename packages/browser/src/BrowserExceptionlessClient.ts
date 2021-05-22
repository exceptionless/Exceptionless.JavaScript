import { Configuration, ExceptionlessClient } from "@exceptionless/core";

import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
import { BrowserRequestInfoPlugin } from "./plugins/BrowserRequestInfoPlugin.js";
import { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";
import { BrowserErrorParser } from "./services/BrowserErrorParser.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  public async startup(
    configurationOrApiKey?: (config: Configuration) => void | string,
  ): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey) {
      config.useLocalStorage();
      config.services.errorParser = new BrowserErrorParser();

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserModuleInfoPlugin());
      config.addPlugin(new BrowserRequestInfoPlugin());
      config.addPlugin(new BrowserWrapFunctions());
    }

    await super.startup(configurationOrApiKey);
  }
}
