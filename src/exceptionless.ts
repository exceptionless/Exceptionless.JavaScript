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
import { DefaultErrorParser } from './services/DefaultErrorParser';
import { DefaultModuleCollector } from './services/DefaultModuleCollector';
import { DefaultRequestInfoCollector } from './services/DefaultRequestInfoCollector';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { IStorage } from './storage/IStorage';
import { IStorageItem } from './storage/IStorageItem';
import { DefaultSubmissionAdapter } from './submission/DefaultSubmissionAdapter';
import { ISubmissionClient } from './submission/ISubmissionClient';
import { SettingsResponse } from './submission/SettingsResponse';
import { SubmissionResponse } from './submission/SubmissionResponse';
import { EventBuilder } from './EventBuilder';
import { ExceptionlessClient } from './ExceptionlessClient';
import { Utils } from './Utils';

function getDefaultsSettingsFromScriptTag(): IConfigurationSettings {
  if (!document || !document.getElementsByTagName) {
    return null;
  }

  let scripts = document.getElementsByTagName('script');
  for (let index = 0; index < scripts.length; index++) {
    if (scripts[index].src && scripts[index].src.indexOf('/exceptionless') > -1) {
      return Utils.parseQueryString(scripts[index].src.split('?').pop());
    }
  }
  return null;
}

function processUnhandledException(stackTrace:TraceKit.StackTrace, options?:any): void {
  let builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || (options || {}).status || 'Script error'), 'onerror');
  builder.pluginContextData['@@_TraceKit.StackTrace'] = stackTrace;
  builder.submit();
}

/*
TODO: We currently are unable to parse string exceptions.
function processJQueryAjaxError(event, xhr, settings, error:string): void {
  let client = ExceptionlessClient.default;
  if (xhr.status === 404) {
    client.submitNotFound(settings.url);
  } else if (xhr.status !== 401) {
    client.createUnhandledException(error, 'JQuery.ajaxError')
      .setSource(settings.url)
      .setProperty('status', xhr.status)
      .setProperty('request', settings.data)
      .setProperty('response', xhr.responseText && xhr.responseText.slice && xhr.responseText.slice(0, 1024))
      .submit();
  }
}
*/

let defaults = Configuration.defaults;
let settings = getDefaultsSettingsFromScriptTag();
if (settings && (settings.apiKey || settings.serverUrl)) {
  defaults.apiKey = settings.apiKey;
  defaults.serverUrl = settings.serverUrl;
}

defaults.errorParser = new DefaultErrorParser();
defaults.moduleCollector = new DefaultModuleCollector();
defaults.requestInfoCollector = new DefaultRequestInfoCollector();
defaults.submissionAdapter = new DefaultSubmissionAdapter();

TraceKit.report.subscribe(processUnhandledException);
TraceKit.extendToAsynchronousCallbacks();

// if (typeof $ !== 'undefined' && $(document)) {
//   $(document).ajaxError(processJQueryAjaxError);
// }

(<any>Error).stackTraceLimit = Infinity;

declare var $;
