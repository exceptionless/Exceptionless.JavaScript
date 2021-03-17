import {
  Configuration,
  ExceptionlessClient,
} from "@exceptionless/core";

import { NodeConfiguration } from "./configuration/NodeConfiguration.js";
import { NodeEnvironmentInfoCollector } from "./services/NodeEnvironmentInfoCollector.js";
import { NodeErrorParser } from "./services/NodeErrorParser.js";
import { NodeRequestInfoCollector } from "./services/NodeRequestInfoCollector.js";
import { NodeFetchSubmissionClient } from "./submission/NodeFetchSubmissionClient.js";

export class NodeExceptionlessClient extends ExceptionlessClient {
  constructor() {
    super(new NodeConfiguration());
  }

  public async startup(configurationOrApiKey?: (config: NodeConfiguration) => void | string): Promise<void> {
    if (configurationOrApiKey) {
      this.config.services.environmentInfoCollector = new NodeEnvironmentInfoCollector();
      this.config.services.errorParser = new NodeErrorParser();
      this.config.services.requestInfoCollector = new NodeRequestInfoCollector();
      this.config.services.submissionClient = new NodeFetchSubmissionClient(this.config);

      // TODO: Register platform specific plugins.
    }

    await super.startup(configurationOrApiKey);
  }
}
/*


import {
  addListener,
  on
} from "process";

addListener("uncaughtException", (error: Error) => {
  //ExceptionlessClient.default.submitUnhandledException(error, "uncaughtException");
});

// TODO: Handle submission https://stackoverflow.com/questions/40574218/how-to-perform-an-async-operation-on-exit

on("exit", (code: number) => {
  /**
   * exit codes: https://nodejs.org/api/process.html#process_event_exit
   * From now on, only synchronous code may run. As soon as this method
   * ends, the application inevitably will exit.
   */
  /*
function getExitCodeReason(exitCode: number): string {
  if (exitCode === 1) {
    return "Uncaught Fatal Exception";
  }

  if (exitCode === 3) {
    return "Internal JavaScript Parse Error";
  }

  if (exitCode === 4) {
    return "Internal JavaScript Evaluation Failure";
  }

  if (exitCode === 5) {
    return "Fatal Exception";
  }

  if (exitCode === 6) {
    return "Non-function Internal Exception Handler ";
  }

  if (exitCode === 7) {
    return "Internal Exception Handler Run-Time Failure";
  }

  if (exitCode === 8) {
    return "Uncaught Exception";
  }

  if (exitCode === 9) {
    return "Invalid Argument";
  }

  if (exitCode === 10) {
    return "Internal JavaScript Run-Time Failure";
  }

  if (exitCode === 12) {
    return "Invalid Debug Argument";
  }

  return null;
}

const message = getExitCodeReason(code);

if (message !== null) {
  Exceptionless.submitLog("exit", message, "Error");
}

Exceptionless.config.queue.process();
  // Application will now exit.
});

//(Error as any).stackTraceLimit = Infinity;
*/
