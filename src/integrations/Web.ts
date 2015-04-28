import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { DefaultSubmissionClient } from '../submission/DefaultSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { IError } from '../models/IError';
import { Utils } from '../Utils';

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

function setDefaults() {
  var settings = getDefaultsSettingsFromScriptTag();
  if (settings && (settings.apiKey || settings.serverUrl)) {
    Configuration.defaults.apiKey = settings.apiKey;
    Configuration.defaults.serverUrl = settings.serverUrl;
  }

  Configuration.defaults.submissionClient = new DefaultSubmissionClient();
}

setDefaults();
handleWindowOnError();
