import { Configuration, ExceptionlessClient, SimpleErrorPlugin } from "@exceptionless/core";

import { BrowserErrorPlugin } from "./plugins/BrowserErrorPlugin.js";
import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
import { BrowserRequestInfoPlugin } from "./plugins/BrowserRequestInfoPlugin.js";
import { BrowserWrapFunctions } from "./plugins/BrowserWrapFunctions.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey && !this._initialized) {
      config.useLocalStorage();

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserModuleInfoPlugin());
      config.addPlugin(new BrowserRequestInfoPlugin());
      config.addPlugin(new BrowserWrapFunctions());
      config.addPlugin(new BrowserErrorPlugin());
    }

    await super.startup(configurationOrApiKey);
    if (configurationOrApiKey && !this._initialized) {
      config.removePlugin(new SimpleErrorPlugin());
    }
  }
}
