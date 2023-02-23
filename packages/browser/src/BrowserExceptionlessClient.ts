import { Configuration, ExceptionlessClient, SimpleErrorPlugin } from "@exceptionless/core";

import { BrowserErrorPlugin } from "./plugins/BrowserErrorPlugin.js";
import { BrowserGlobalHandlerPlugin } from "./plugins/BrowserGlobalHandlerPlugin.js";
import { BrowserIgnoreExtensionErrorsPlugin } from "./plugins/BrowserIgnoreExtensionErrorsPlugin.js";
import { BrowserLifeCyclePlugin } from "./plugins/BrowserLifeCyclePlugin.js";
import { BrowserModuleInfoPlugin } from "./plugins/BrowserModuleInfoPlugin.js";
import { BrowserRequestInfoPlugin } from "./plugins/BrowserRequestInfoPlugin.js";

export class BrowserExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;
    if (configurationOrApiKey && !this._initialized) {
      config.useLocalStorage();

      config.addPlugin(new BrowserGlobalHandlerPlugin());
      config.addPlugin(new BrowserIgnoreExtensionErrorsPlugin());
      config.addPlugin(new BrowserLifeCyclePlugin());
      config.addPlugin(new BrowserModuleInfoPlugin());
      config.addPlugin(new BrowserRequestInfoPlugin());
      config.addPlugin(new BrowserErrorPlugin());
      config.removePlugin(new SimpleErrorPlugin());
    }

    await super.startup(configurationOrApiKey);
  }
}
