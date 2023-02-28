import {
  Configuration,
  ExceptionlessClient,
  LocalStorage,
  SimpleErrorPlugin
} from "@exceptionless/core";

import { LocalStorage as LocalStoragePolyfill } from "node-localstorage";

import { NodeErrorPlugin } from "./plugins/NodeErrorPlugin.js";
import { NodeEnvironmentInfoPlugin } from "./plugins/NodeEnvironmentInfoPlugin.js";
import { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
import { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
import { NodeRequestInfoPlugin } from "./plugins/NodeRequestInfoPlugin.js";
import { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";

export class NodeExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;

    if (configurationOrApiKey && !this._initialized) {
      const storage = new LocalStorage(undefined, new LocalStoragePolyfill(process.cwd() + '/.exceptionless'));
      config.useLocalStorage = () => storage;
      config.services.storage = storage;

      config.addPlugin(new NodeEnvironmentInfoPlugin());
      config.addPlugin(new NodeGlobalHandlerPlugin());
      config.addPlugin(new NodeLifeCyclePlugin());
      config.addPlugin(new NodeRequestInfoPlugin());
      config.addPlugin(new NodeWrapFunctions());
      config.addPlugin(new NodeErrorPlugin());
      config.removePlugin(new SimpleErrorPlugin());
    }

    await super.startup(configurationOrApiKey);
  }
}
