import { Configuration } from './configuration/Configuration';
import { IConfigurationSettings } from './configuration/IConfigurationSettings';
import { ILastReferenceIdManager } from './lastReferenceIdManager/ILastReferenceIdManager';
import { InMemoryLastReferenceIdManager } from './lastReferenceIdManager/InMemoryLastReferenceIdManager';
import { ConsoleLog } from './logging/ConsoleLog';
import { ILog } from './logging/ILog';
import { NullLog } from './logging/NullLog';
import { IError } from './models/IError';
import { IEvent } from './models/IEvent';
import { IInnerError } from './models/IInnerError';
import { IMethod } from './models/IMethod';
import { IModule } from './models/IModule';
import { IParameter } from './models/IParameter';
import { IRequestInfo } from './models/IRequestInfo';
import { IStackFrame } from './models/IStackFrame';
import { IUserDescription } from './models/IUserDescription';
import { ContextData } from './plugins/ContextData';
import { EventPluginContext } from './plugins/EventPluginContext';
import { EventPluginManager } from './plugins/EventPluginManager';
import { IEventPlugin } from './plugins/IEventPlugin';
import { ConfigurationDefaultsPlugin } from './plugins/default/ConfigurationDefaultsPlugin';
import { DuplicateCheckerPlugin } from './plugins/default/DuplicateCheckerPlugin';
import { ErrorPlugin } from './plugins/default/ErrorPlugin';
import { ModuleInfoPlugin } from './plugins/default/ModuleInfoPlugin';
import { ReferenceIdPlugin } from './plugins/default/ReferenceIdPlugin';
import { RequestInfoPlugin } from './plugins/default/RequestInfoPlugin';
import { SubmissionMethodPlugin } from './plugins/default/SubmissionMethodPlugin';
import { DefaultEventQueue } from './queue/DefaultEventQueue';
import { IEventQueue } from './queue/IEventQueue';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { IStorage } from './storage/IStorage';
import { DefaultSubmissionClient } from './submission/DefaultSubmissionClient';
import { ISubmissionClient } from './submission/ISubmissionClient';
import { SettingsResponse } from './submission/SettingsResponse';
import { SubmissionResponse } from './submission/SubmissionResponse';
import { EventBuilder } from 'EventBuilder';
import { ExceptionlessClient } from 'ExceptionlessClient';
import { Utils } from 'Utils';

function getDefaultsSettingsFromScriptTag(): IConfigurationSettings {
  if (!document || !document.getElementsByTagName) {
    return null;
  }

  var scripts = document.getElementsByTagName('script');
  for (var index = 0; index < scripts.length; index++) {
    if (scripts[index].src && scripts[index].src.indexOf('/exceptionless') > -1) {
      return Utils.parseQueryString(scripts[index].src.split('?').pop());
    }
  }
  return null;
}

function handleWindowOnError() {
  if (!window || !window.onerror) {
    return;
  }

  var _oldOnErrorHandler:any = window.onerror;
  (<any>window).onerror = (message:string, filename:string, lineno:number, colno:number, error:Error) => {
    var client = ExceptionlessClient.default;

    if (error !== null && typeof error === 'object') {
      client.submitUnhandledException(error);
    } else {
      // Only message, filename and lineno work here.
      var e:IError = {message: message, stack_trace: [{file_name: filename, line_number: lineno, column: colno}]};
      client.createUnhandledException(new Error(message)).setMessage(message).setProperty('@error', e).submit();
    }

    if (_oldOnErrorHandler) {
      try {
        return _oldOnErrorHandler(message, filename, lineno, colno, error);
      } catch (e) {
        client.config.log.error('An error occurred while calling previous error handler: ' + e.message);
      }
    }

    return false;
  }
}

var settings = getDefaultsSettingsFromScriptTag();
if (settings && (settings.apiKey || settings.serverUrl)) {
  Configuration.defaults.apiKey = settings.apiKey;
  Configuration.defaults.serverUrl = settings.serverUrl;
}

Configuration.defaults.submissionClient = new DefaultSubmissionClient();
handleWindowOnError();
