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
    const TIMEOUT:string = 'timeout';  // optimization for minifier.
    const LOADED:string = 'loaded';  // optimization for minifier.
    const WITH_CREDENTIALS:string = 'withCredentials';  // optimization for minifier.

    var isCompleted:boolean = false;
    var useSetTimeout:boolean = false;
    function complete(mode:string, xhr:XMLHttpRequest) {
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
      }

      isCompleted = true;

      var message:string = xhr.statusText;
      var responseText:string = xhr.responseText;
      var status:number = xhr.status;

      if (mode === TIMEOUT || status === 0) {
        message = 'Unable to connect to server.';
        status = 0;
      } else if (mode === LOADED && !status) {
          status = method === 'POST' ? 202 : 200;
      } else if (status < 200 || status > 299) {
        var responseBody:any = xhr.responseBody;
        if (!!responseBody && !!responseBody.message) {
          message = responseBody.message;
        } else if (!!responseText && responseText.indexOf('message') !== -1) {
          try {
            message =  JSON.parse(responseText).message;
          } catch (e) {
            message = responseText;
          }
        }
      }

      callback(status || 500, message || '', responseText, parseResponseHeaders(xhr.getAllResponseHeaders && xhr.getAllResponseHeaders()));
    }

    function createRequest(config:Configuration, method:string, url:string): XMLHttpRequest {
      var xhr:any = new XMLHttpRequest();
      if (WITH_CREDENTIALS in xhr) {
        xhr.open(method, url, true);

        xhr.setRequestHeader('X-Exceptionless-Client', config.userAgent);
        if (method === 'POST') {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
      } else if (typeof XDomainRequest != 'undefined') {
        useSetTimeout = true;
        xhr = new XDomainRequest();
        xhr.open(method, location.protocol === 'http:' ? url.replace('https:', 'http:') : url);
      } else {
        xhr = null;
      }

      if (xhr) {
        xhr.timeout = 10000;
      }

      return xhr;
    }

    var url = `${config.serverUrl}${path}?access_token=${encodeURIComponent(config.apiKey)}`;
    var xhr = createRequest(config, method || 'POST', url);
    if (!xhr) {
      return callback(503, 'CORS not supported.');
    }

    if (WITH_CREDENTIALS in xhr) {
      xhr.onreadystatechange = () => {
        // xhr not ready.
        if (xhr.readyState !== 4) {
          return;
        }

        complete(LOADED, xhr);
      };
    }

    xhr.onprogress = () => {};
    xhr.ontimeout = () => complete(TIMEOUT, xhr);
    xhr.onerror = () => complete('error', xhr);
    xhr.onload = () => complete(LOADED, xhr);

    if (useSetTimeout) {
      setTimeout(() => xhr.send(data), 500);
    } else {
      xhr.send(data);
    }
  }
}
