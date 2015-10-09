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
import { NodeExitController } from './services/NodeExitController';
import { NodeRequestInfoCollector } from './services/NodeRequestInfoCollector';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { IStorage } from './storage/IStorage';
import { IStorageItem } from './storage/IStorageItem';
import { DefaultSubmissionClient } from './submission/DefaultSubmissionClient';
import { ISubmissionClient } from './submission/ISubmissionClient';
import { NodeSubmissionClient } from './submission/NodeSubmissionClient';
import { SettingsResponse } from './submission/SettingsResponse';
import { SubmissionResponse } from './submission/SubmissionResponse';
import { EventBuilder } from './EventBuilder';
import { ExceptionlessClient } from './ExceptionlessClient';
import { Utils } from './Utils';

const EXIT:string = 'exit';
const UNCAUGHT_EXCEPTION:string = 'uncaughtException';

var defaults = Configuration.defaults;
defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
defaults.errorParser = new NodeErrorParser();
defaults.exitController = new NodeExitController();
defaults.requestInfoCollector = new NodeRequestInfoCollector();
defaults.submissionClient = new NodeSubmissionClient();

function getListenerCount(emitter, event):number {
  if (emitter.listenerCount) {
    return emitter.listenerCount(event);
  }

  return require("events").listenerCount(emitter, event);
}

process.on(UNCAUGHT_EXCEPTION, function (error:Error) {
  ExceptionlessClient.default.submitUnhandledException(error, UNCAUGHT_EXCEPTION);

  /*
   * Default Node behavior: If this is the only uncaught-listener, we still exit.
   * Discussion: https://nodejs.org/api/process.html#process_event_uncaughtexception
   */
  var uncaughtListenerCount = getListenerCount(process, UNCAUGHT_EXCEPTION);
  if (uncaughtListenerCount <= 1) {
    process.exit(1);
  }
});

process.on(EXIT, function (code:number) {
  /**
   * exit codes: https://nodejs.org/api/process.html#process_event_exit
   * From now on, only synchronous code may run. As soon as this method
   * ends, the application inevitably will exit.
   */
  function  getExitCodeReason(code:number): string {
    if (code === 1) {
      return 'Uncaught Fatal Exception';
    }

    if (code === 3) {
      return 'Internal JavaScript Parse Error';
    }

    if (code === 4) {
      return 'Internal JavaScript Evaluation Failure';
    }

    if (code === 5) {
      return 'Fatal Exception';
    }

    if (code === 6) {
      return 'Non-function Internal Exception Handler ';
    }

    if (code === 7) {
      return 'Internal Exception Handler Run-Time Failure';
    }

    if (code === 8) {
      return 'Uncaught Exception';
    }

    if (code === 9) {
      return 'Invalid Argument';
    }

    if (code === 10) {
      return 'Internal JavaScript Run-Time Failure';
    }

    if (code === 12) {
      return 'Invalid Debug Argument';
    }

    if (code > 128) {
      return 'Signal Exits';
    }

    return null;
  }

  var client = ExceptionlessClient.default;
  var config = client.config;
  var message = getExitCodeReason(code);

  if (message !== null) {
    client.submitLog(EXIT, message, 'Error')
  }

  config.exitController.processExit(config);

  // Application will now exit.
});

(<any>Error).stackTraceLimit = Infinity;
