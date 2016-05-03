import { Configuration } from './configuration/Configuration';
import { IConfigurationSettings } from './configuration/IConfigurationSettings';
import { SettingsManager } from './configuration/SettingsManager';
import { DefaultErrorParser } from './services/DefaultErrorParser';
import { DefaultModuleCollector } from './services/DefaultModuleCollector';
import { DefaultRequestInfoCollector } from './services/DefaultRequestInfoCollector';
import { DefaultSubmissionAdapter } from './submission/DefaultSubmissionAdapter';
import { BrowserStorage } from './storage/BrowserStorage';
import { BrowserStorageProvider } from './storage/BrowserStorageProvider';
import { ExceptionlessClient } from './ExceptionlessClient';
import { Utils } from './Utils';
import * as TraceKit from 'TraceKit';

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

function processUnhandledException(stackTrace: TraceKit.StackTrace, options?: any): void {
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

Configuration.prototype.useLocalStorage = function() {
  if (BrowserStorage.isAvailable()) {
    this.storage = new BrowserStorageProvider();
    SettingsManager.applySavedServerSettings(this);
  }
};

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

// window && window.addEventListener && window.addEventListener('beforeunload', function () {
//   ExceptionlessClient.default.config.queue.process(true);
// });

// if (typeof $ !== 'undefined' && $(document)) {
//   $(document).ajaxError(processJQueryAjaxError);
// }

(<any>Error).stackTraceLimit = Infinity;

declare var $;
