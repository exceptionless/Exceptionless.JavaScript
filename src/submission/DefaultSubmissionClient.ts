import { Configuration } from '../configuration/Configuration';
import { SettingsManager } from '../configuration/SettingsManager';
import { IEvent } from '../models/IEvent';
import { IClientConfiguration } from '../models/IClientConfiguration';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

declare var XDomainRequest:{ new (); create(); };

export class DefaultSubmissionClient implements ISubmissionClient {
  public configurationVersionHeader:string = 'X-Exceptionless-ConfigVersion';

  public postEvents(events:IEvent[], config:Configuration, callback:(response:SubmissionResponse) => void):void {
    return this.sendRequest(config, 'POST', '/api/v2/events', Utils.stringify(events, config.dataExclusions), (status:number, message:string, data?:string, headers?:Object) => {
      var settingsVersion:number = headers && parseInt(headers[this.configurationVersionHeader]);
      SettingsManager.checkVersion(settingsVersion, config);

      callback(new SubmissionResponse(status, message));
    });
  }

  public postUserDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(response:SubmissionResponse) => void):void {
    var path = `/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description`;
    return this.sendRequest(config, 'POST', path, Utils.stringify(description, config.dataExclusions), (status:number, message:string, data?:string, headers?:Object) => {
      var settingsVersion:number = headers && parseInt(headers[this.configurationVersionHeader]);
      SettingsManager.checkVersion(settingsVersion, config);

      callback(new SubmissionResponse(status, message));
    });
  }

  public getSettings(config:Configuration, callback:(response:SettingsResponse) => void):void {
    return this.sendRequest(config, 'GET', '/api/v2/projects/config', null, (status:number, message:string, data?:string) => {
      if (status !== 200) {
        return callback(new SettingsResponse(false, null, -1, null, message));
      }

      var settings:IClientConfiguration;
      try {
        settings = JSON.parse(data);
      } catch (e) {
        config.log.error(`Unable to parse settings: '${data}'`);
      }

      if (!settings || isNaN(settings.version)) {
        return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
      }

      callback(new SettingsResponse(true, settings.settings || {}, settings.version));
    });
  }

  public sendRequest(config:Configuration, method:string, path:string, data:string, callback: (status:number, message:string, data?:string, headers?:Object) => void): void {
    var isCompleted = false;
    function complete(xhr:XMLHttpRequest) {
      function parseResponseHeaders(headerStr) {
        var headers = {};
        var headerPairs = (headerStr || '').split('\u000d\u000a');
        for (var index:number = 0; index < headerPairs.length; index++) {
          var headerPair = headerPairs[index];
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          var separator = headerPair.indexOf('\u003a\u0020');
          if (separator > 0) {
            headers[headerPair.substring(0, separator)] = headerPair.substring(separator + 2);
          }
        }

        return headers;
      }

      if (isCompleted) {
        return;
      } else {
        isCompleted = true;
      }

      var message:string;
      if (xhr.status === 0) {
        message = 'Unable to connect to server.';
      } else if (xhr.status < 200 || xhr.status > 299) {
        if (!!xhr.responseBody && !!xhr.responseBody.message) {
          message = xhr.responseBody.message;
        } else if (!!xhr.responseText && xhr.responseText.indexOf('message') !== -1) {
          try {
            message =  JSON.parse(xhr.responseText).message;
          } catch (e) {
            message = xhr.responseText;
          }
        } else {
          message = xhr.statusText;
        }
      }

      callback(xhr.status || 500, message, xhr.responseText, parseResponseHeaders(xhr.getAllResponseHeaders()));
    }

    function createRequest(config:Configuration, method:string, url:string): XMLHttpRequest {
      var xhr:any = new XMLHttpRequest();
      if ('withCredentials' in xhr) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest != 'undefined') {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }

      if (xhr) {
        xhr.setRequestHeader('X-Exceptionless-Client', config.userAgent);
        if (method === 'POST' && xhr.setRequestHeader) {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }

        xhr.timeout = 10000;
      }

      return xhr;
    }

    var url = `${config.serverUrl}${path}?access_token=${encodeURIComponent(config.apiKey)}`;
    var xhr = createRequest(config, method || 'POST', url);
    if (!xhr) {
      return callback(503,'CORS not supported.');
    }

    if ('withCredentials' in xhr) {
      xhr.onreadystatechange = () => {
        // xhr not ready.
        if (xhr.readyState !== 4) {
          return;
        }

        complete(xhr);
      };
    }

    xhr.ontimeout = () => complete(xhr);
    xhr.onerror = () => complete(xhr);
    xhr.onload = () => complete(xhr);

    xhr.send(data);
  }
}
