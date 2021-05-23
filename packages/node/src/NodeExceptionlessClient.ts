import {
  Configuration,
  DefaultSubmissionClient,
  ExceptionlessClient,
  LocalStorage
} from "@exceptionless/core";

import { NodeEnvironmentInfoPlugin } from "./plugins/NodeEnvironmentInfoPlugin.js";
import { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
import { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
import { NodeRequestInfoPlugin } from "./plugins/NodeRequestInfoPlugin.js";
import { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";
import { NodeErrorParser } from "./services/NodeErrorParser.js";
import { LocalStorage as LocalStoragePolyfill } from "node-localstorage";
import fetch from "node-fetch";

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

      config.services.errorParser = new NodeErrorParser();

      config.addPlugin(new NodeEnvironmentInfoPlugin());
      config.addPlugin(new NodeGlobalHandlerPlugin());
      config.addPlugin(new NodeLifeCyclePlugin());
      config.addPlugin(new NodeRequestInfoPlugin());
      config.addPlugin(new NodeWrapFunctions());
    }

    await super.startup(configurationOrApiKey);
  }
}
