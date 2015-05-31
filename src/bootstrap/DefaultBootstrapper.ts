import { IBootstrapper } from 'IBootstrapper';
import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { IError } from '../models/IError';
import { DefaultErrorParser } from '../services/DefaultErrorParser';
import { DefaultModuleCollector } from '../services/DefaultModuleCollector';
import { DefaultRequestInfoCollector } from '../services/DefaultRequestInfoCollector';
import { DefaultSubmissionClient } from '../submission/DefaultSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { Utils } from '../Utils';

export class DefaultBootstrapper implements IBootstrapper {
  public register(): void {
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

    function processUnhandledException(stackTrace:TraceKit.StackTrace, options?:any): void {
      var builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || (options || {}).status || 'Script error'), 'onerror');
      builder.pluginContextData['@@_TraceKit.StackTrace'] = stackTrace;
      builder.submit();
    }

    function processJQueryAjaxError(event, xhr, settings, error:Error): void {
      var client = ExceptionlessClient.default;
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

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    var defaults = Configuration.defaults;
    var settings = getDefaultsSettingsFromScriptTag();
    if (settings && (settings.apiKey || settings.serverUrl)) {
      defaults.apiKey = settings.apiKey;
      defaults.serverUrl = settings.serverUrl;
    }

    defaults.errorParser = new DefaultErrorParser();
    defaults.moduleCollector = new DefaultModuleCollector();
    defaults.requestInfoCollector = new DefaultRequestInfoCollector();
    defaults.submissionClient = new DefaultSubmissionClient();

    TraceKit.report.subscribe(processUnhandledException);
    TraceKit.extendToAsynchronousCallbacks();

    if (typeof $ !== 'undefined' && $(document)) {
      $(document).ajaxError(processJQueryAjaxError);
    }
  }
}

declare var $;
