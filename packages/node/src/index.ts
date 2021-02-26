
import {
  addListener,
  on
} from "process";

import {
  Configuration,
  ExceptionlessClient,
  SettingsManager
} from "@exceptionless/core";

import { NodeEnvironmentInfoCollector } from "./services/NodeEnvironmentInfoCollector.js";
import { NodeErrorParser } from "./services/NodeErrorParser.js";
import { NodeModuleCollector } from "./services/NodeModuleCollector.js";
import { NodeRequestInfoCollector } from "./services/NodeRequestInfoCollector.js";
import { NodeFileStorageProvider } from "./storage/NodeFileStorageProvider.js";
import { FetchSubmissionClient } from "./submission/FetchSubmissionClient.js";

function init() {
  if (typeof process === "undefined") {
    return;
  }

  const defaults = Configuration.defaults;
  defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
  defaults.errorParser = new NodeErrorParser();
  defaults.moduleCollector = new NodeModuleCollector();
  defaults.requestInfoCollector = new NodeRequestInfoCollector();
  defaults.submissionClient = new FetchSubmissionClient(ExceptionlessClient.default.config); // TODO: Figure out how to flow in the client settings.

  Configuration.prototype.useLocalStorage = function() {
    this.storage = new NodeFileStorageProvider();
    SettingsManager.applySavedServerSettings(this);
    this.changed();
  };

  addListener("uncaughtException", (error: Error) => {
    ExceptionlessClient.default.submitUnhandledException(error, "uncaughtException");
  });

  // TODO: Handle submission https://stackoverflow.com/questions/40574218/how-to-perform-an-async-operation-on-exit

  on("exit", (code: number) => {
    /**
     * exit codes: https://nodejs.org/api/process.html#process_event_exit
     * From now on, only synchronous code may run. As soon as this method
     * ends, the application inevitably will exit.
     */
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

    const client = ExceptionlessClient.default;
    const message = getExitCodeReason(code);

    if (message !== null) {
      client.submitLog("exit", message, "Error");
    }

    client.config.queue.process();
    // Application will now exit.
  });

  (Error as any).stackTraceLimit = Infinity;
}

init();

// TODO: Export all services
export { ExceptionlessClient };
