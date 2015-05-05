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

    var settings = this.getDefaultsSettingsFromScriptTag();
    if (settings && (settings.apiKey || settings.serverUrl)) {
      Configuration.defaults.apiKey = settings.apiKey;
      Configuration.defaults.serverUrl = settings.serverUrl;
    }

    Configuration.defaults.errorParser = new WebErrorParser();
    Configuration.defaults.moduleCollector = new WebModuleCollector();
    Configuration.defaults.requestInfoCollector = new WebRequestInfoCollector();
    Configuration.defaults.submissionClient = new DefaultSubmissionClient();
    this.handleWindowOnError();
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

  private handleWindowOnError(): void {
    var _oldOnErrorHandler:any = window.onerror;
    (<any>window).onerror = (message:string, filename:string, lineno:number, colno:number, error:Error) => {
      var client = ExceptionlessClient.default;

      if (error !== null && typeof error === 'object') {
        client.submitUnhandledException(error, 'onerror');
      } else {
        // Only message, filename and lineno work here.
        var e:IError = {
          message: message,
          stack_trace: [{
            file_name: filename,
            line_number: lineno,
            column: colno
          }]
        };

        client.createUnhandledException(new Error(message), 'onerror').setMessage(message).setProperty('@error', e).submit();
      }

      if (_oldOnErrorHandler) {
        try {
          return _oldOnErrorHandler(message, filename, lineno, colno, error);
        } catch (e) {
          client.config.log.error(`An error occurred while calling previous error handler: ${e.message}`);
        }
      }

      return false;
    }
  }
}
