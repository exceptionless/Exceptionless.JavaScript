import { Configuration } from './configuration/Configuration';
import { IConfigurationSettings } from './configuration/IConfigurationSettings';
import { SettingsManager } from './configuration/SettingsManager';
import { ILastReferenceIdManager } from './lastReferenceIdManager/ILastReferenceIdManager';
import { DefaultLastReferenceIdManager } from './lastReferenceIdManager/DefaultLastReferenceIdManager';
import { ConsoleLog } from './logging/ConsoleLog';
import { ILog } from './logging/ILog';
import { NullLog } from './logging/NullLog';
import { IClientConfiguration } from './models/IClientConfiguration';
import { IEnvironmentInfo } from './models/IEnvironmentInfo';
import { IError } from './models/IError';
import { IEvent } from './models/IEvent';
import { IInnerError } from './models/IInnerError';
import { IMethod } from './models/IMethod';
import { IModule } from './models/IModule';
import { IParameter } from './models/IParameter';
import { IRequestInfo } from './models/IRequestInfo';
import { IStackFrame } from './models/IStackFrame';
import { IUserDescription } from './models/IUserDescription';
import { IUserInfo } from './models/IUserInfo';
import { ContextData } from './plugins/ContextData';
import { EventPluginContext } from './plugins/EventPluginContext';
import { EventPluginManager } from './plugins/EventPluginManager';
import { IEventPlugin } from './plugins/IEventPlugin';
import { ConfigurationDefaultsPlugin } from './plugins/default/ConfigurationDefaultsPlugin';
import { ErrorPlugin } from './plugins/default/ErrorPlugin';
import { ModuleInfoPlugin } from './plugins/default/ModuleInfoPlugin';
import { ReferenceIdPlugin } from './plugins/default/ReferenceIdPlugin';
import { RequestInfoPlugin } from './plugins/default/RequestInfoPlugin';
import { EnvironmentInfoPlugin } from './plugins/default/EnvironmentInfoPlugin';
import { SubmissionMethodPlugin } from './plugins/default/SubmissionMethodPlugin';
import { DefaultEventQueue } from './queue/DefaultEventQueue';
import { IEventQueue } from './queue/IEventQueue';
import { IEnvironmentInfoCollector } from './services/IEnvironmentInfoCollector';
import { IErrorParser } from './services/IErrorParser';
import { IModuleCollector } from './services/IModuleCollector';
import { IRequestInfoCollector } from './services/IRequestInfoCollector';
import { NodeEnvironmentInfoCollector } from './services/NodeEnvironmentInfoCollector';
import { NodeErrorParser } from './services/NodeErrorParser';
import { NodeModuleCollector } from './services/NodeModuleCollector';
import { NodeRequestInfoCollector } from './services/NodeRequestInfoCollector';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { IStorage } from './storage/IStorage';
import { IStorageItem } from './storage/IStorageItem';
import { NodeSubmissionAdapter } from './submission/NodeSubmissionAdapter';
import { SettingsResponse } from './submission/SettingsResponse';
import { SubmissionResponse } from './submission/SubmissionResponse';
import { EventBuilder } from './EventBuilder';
import { ExceptionlessClient } from './ExceptionlessClient';
import { Utils } from './Utils';

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

function getListenerCount(emitter, event:string): number {
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
