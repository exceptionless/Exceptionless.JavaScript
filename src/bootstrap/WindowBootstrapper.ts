import { IBootstrapper } from 'IBootstrapper';
import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { IError } from '../models/IError';
import { WebErrorParser } from '../services/WebErrorParser';
import { WebModuleCollector } from '../services/WebModuleCollector';
import { WebRequestInfoCollector } from '../services/WebRequestInfoCollector';
import { DefaultSubmissionClient } from '../submission/DefaultSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { Utils } from '../Utils';

export class WindowBootstrapper implements IBootstrapper {
  public register(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    var configDefaults = Configuration.defaults;
    var settings = this.getDefaultsSettingsFromScriptTag();
    if (settings && (settings.apiKey || settings.serverUrl)) {
      configDefaults.apiKey = settings.apiKey;
      configDefaults.serverUrl = settings.serverUrl;
    }

    configDefaults.errorParser = new WebErrorParser();
    configDefaults.moduleCollector = new WebModuleCollector();
    configDefaults.requestInfoCollector = new WebRequestInfoCollector();
    configDefaults.submissionClient = new DefaultSubmissionClient();

    TraceKit.report.subscribe(this.processUnhandledException);
    TraceKit.extendToAsynchronousCallbacks();
    if ($ && $(document)) {
      $(document).ajaxError(this.processJQueryAjaxError);
    }
  }

  private getDefaultsSettingsFromScriptTag(): IConfigurationSettings {
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

  private processUnhandledException(stackTrace:TraceKit.StackTrace, options): void {
    options == options || {};
    var builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || options.status || 'Script error'), 'onerror');
    builder.pluginContextData['@@_TraceKit.StackTrace'] = stackTrace;
    builder.submit();
  }

  private processJQueryAjaxError(event, xhr, settings, error): void {
    var client = ExceptionlessClient.default;
    if (xhr.status === 404) {
      client.submitNotFound(settings.url);
    } else if (xhr.status !== 401) {
      client.createUnhandledException(error, 'JQuery.ajaxError')
        .setSource(settings.url)
        .setProperty('status', xhr.status)
        .setProperty('request', settings.data)
        .setProperty('response', xhr.responseText && xhr.responseText.slice ? xhr.responseText.slice(0, 1024) : undefined)
        .submit();
    }
  }
}

declare var $;
