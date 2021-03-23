import {
  Configuration,
  ExceptionlessClient,
} from "@exceptionless/core";

import { NodeConfiguration } from "./configuration/NodeConfiguration.js";
import { NodeGlobalHandlerPlugin } from "./plugins/NodeGlobalHandlerPlugin.js";
import { NodeLifeCyclePlugin } from "./plugins/NodeLifeCyclePlugin.js";
import { NodeWrapFunctions } from "./plugins/NodeWrapFunctions.js";
import { NodeEnvironmentInfoCollector } from "./services/NodeEnvironmentInfoCollector.js";
import { NodeErrorParser } from "./services/NodeErrorParser.js";
import { NodeRequestInfoCollector } from "./services/NodeRequestInfoCollector.js";
import { NodeFetchSubmissionClient } from "./submission/NodeFetchSubmissionClient.js";

export class NodeExceptionlessClient extends ExceptionlessClient {
  constructor() {
    super(new NodeConfiguration());
  }

  public async startup(configurationOrApiKey?: (config: NodeConfiguration) => void | string): Promise<void> {
    const config = this.config;

    if (configurationOrApiKey) {
      config.services.environmentInfoCollector = new NodeEnvironmentInfoCollector();
      config.services.errorParser = new NodeErrorParser();
      config.services.requestInfoCollector = new NodeRequestInfoCollector();
      config.services.submissionClient = new NodeFetchSubmissionClient(config);

      config.addPlugin(new NodeGlobalHandlerPlugin());
      config.addPlugin(new NodeLifeCyclePlugin());
      config.addPlugin(new NodeWrapFunctions());
    }

    await super.startup(configurationOrApiKey);
  }
}
