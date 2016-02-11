import { Configuration } from './configuration/Configuration';
import { SettingsManager } from './configuration/SettingsManager';
import { NodeEnvironmentInfoCollector } from './services/NodeEnvironmentInfoCollector';
import { NodeErrorParser } from './services/NodeErrorParser';
import { NodeModuleCollector } from './services/NodeModuleCollector';
import { NodeRequestInfoCollector } from './services/NodeRequestInfoCollector';
import { NodeSubmissionAdapter } from './submission/NodeSubmissionAdapter';
import { NodeFileStorage } from './storage/NodeFileStorage';
import { ExceptionlessClient } from './ExceptionlessClient';

const EXIT: string = 'exit';
const UNCAUGHT_EXCEPTION: string = 'uncaughtException';
const SIGINT: string = 'SIGINT';
const SIGINT_CODE: number = 2;

let defaults = Configuration.defaults;
defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
defaults.errorParser = new NodeErrorParser();
defaults.moduleCollector = new NodeModuleCollector();
defaults.requestInfoCollector = new NodeRequestInfoCollector();
defaults.submissionAdapter = new NodeSubmissionAdapter();

Configuration.prototype.useLocalStorage = function() {
  this.storage = new NodeFileStorage('.exceptionless');
  SettingsManager.applySavedServerSettings(this);
};

function getListenerCount(emitter, event: string): number {
  if (emitter.listenerCount) {
    return emitter.listenerCount(event);
  }
  return require('events').listenerCount(emitter, event);
}

/*
 * Adding a event handler for 'uncaughtException' modifies the default
 * Node behavior, so it won't exit or log to the console. Instead,
 * we hijack the event emitter and forward the exception to the callback.
 */
function onUncaughtException(callback: (error: Error) => void) {
  let originalEmit = process.emit;

  process.emit = function(type: string, error: Error) {
    if (type === UNCAUGHT_EXCEPTION) {
      callback(error);
    }

    return originalEmit.apply(this, arguments);
  };
}

onUncaughtException(function(error: Error) {
  ExceptionlessClient.default.submitUnhandledException(error, UNCAUGHT_EXCEPTION);
});

/*
 * We cannot hijack SIGINT, so if there are no other handlers,
 * we just reproduce default Node.js behavior by exiting.
 */
process.on(SIGINT, function() {
  if (getListenerCount(process, SIGINT) <= 1) {
    process.exit(128 + SIGINT_CODE);
  }
});

process.on(EXIT, function(code: number) {
  /**
   * exit codes: https://nodejs.org/api/process.html#process_event_exit
   * From now on, only synchronous code may run. As soon as this method
   * ends, the application inevitably will exit.
   */
  function getExitCodeReason(exitCode: number): string {
    if (exitCode === 1) {
      return 'Uncaught Fatal Exception';
    }

    if (exitCode === 3) {
      return 'Internal JavaScript Parse Error';
    }

    if (exitCode === 4) {
      return 'Internal JavaScript Evaluation Failure';
    }

    if (exitCode === 5) {
      return 'Fatal Exception';
    }

    if (exitCode === 6) {
      return 'Non-function Internal Exception Handler ';
    }

    if (exitCode === 7) {
      return 'Internal Exception Handler Run-Time Failure';
    }

    if (exitCode === 8) {
      return 'Uncaught Exception';
    }

    if (exitCode === 9) {
      return 'Invalid Argument';
    }

    if (exitCode === 10) {
      return 'Internal JavaScript Run-Time Failure';
    }

    if (exitCode === 12) {
      return 'Invalid Debug Argument';
    }

    return null;
  }

  let client = ExceptionlessClient.default;
  let message = getExitCodeReason(code);

  if (message !== null) {
    client.submitLog(EXIT, message, 'Error');
  }

  client.config.queue.process(true);
  // Application will now exit.
});

(<any>Error).stackTraceLimit = Infinity;
