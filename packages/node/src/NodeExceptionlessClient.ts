import {
  Configuration,
  ExceptionlessClient
} from "@exceptionless/core";

import { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
import { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
import { NodeRequestInfoPlugin } from "./plugins/NodeRequestInfoPlugin.js";
import { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";
import { NodeEnvironmentInfoCollector } from "./services/NodeEnvironmentInfoCollector.js";
import { NodeErrorParser } from "./services/NodeErrorParser.js";
import { NodeFileStorage } from "./storage/NodeFileStorage.js";
import { NodeFetchSubmissionClient } from "./submission/NodeFetchSubmissionClient.js";

export class NodeExceptionlessClient extends ExceptionlessClient {
  public async startup(configurationOrApiKey?: (config: Configuration) => void | string): Promise<void> {
    const config = this.config;

    if (configurationOrApiKey) {
      config.services.storage = new NodeFileStorage();
      config.services.environmentInfoCollector = new NodeEnvironmentInfoCollector();
      config.services.errorParser = new NodeErrorParser();
      config.services.submissionClient = new NodeFetchSubmissionClient(config);

      config.addPlugin(new NodeGlobalHandlerPlugin());
      config.addPlugin(new NodeLifeCyclePlugin());
      config.addPlugin(new NodeRequestInfoPlugin());
      config.addPlugin(new NodeWrapFunctions());
    }

    await super.startup(configurationOrApiKey);
  }
}
