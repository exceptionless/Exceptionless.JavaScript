import {
  Configuration,
  DefaultSubmissionClient,
  ExceptionlessClient,
  LocalStorage,
  SimpleErrorPlugin
} from "@exceptionless/core";

import { LocalStorage as LocalStoragePolyfill } from "node-localstorage";
import fetch from "node-fetch";

import { NodeErrorPlugin } from "./plugins/NodeErrorPlugin.js";
import { NodeEnvironmentInfoPlugin } from "./plugins/NodeEnvironmentInfoPlugin.js";
import { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
import { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
import { NodeRequestInfoPlugin } from "./plugins/NodeRequestInfoPlugin.js";
import { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";

export class NodeExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;

    if (configurationOrApiKey) {
      if (!globalThis?.localStorage) {
        config.services.storage = new LocalStorage(undefined, new LocalStoragePolyfill(process.cwd() + '/.exceptionless'));
      }

      if (!globalThis?.fetch) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        config.services.submissionClient = new DefaultSubmissionClient(config, fetch);
      }

      config.addPlugin(new NodeEnvironmentInfoPlugin());
      config.addPlugin(new NodeGlobalHandlerPlugin());
      config.addPlugin(new NodeLifeCyclePlugin());
      config.addPlugin(new NodeRequestInfoPlugin());
      config.addPlugin(new NodeWrapFunctions());

      config.removePlugin(new SimpleErrorPlugin());
      config.addPlugin(new NodeErrorPlugin());
    }

    await super.startup(configurationOrApiKey);
  }
}
