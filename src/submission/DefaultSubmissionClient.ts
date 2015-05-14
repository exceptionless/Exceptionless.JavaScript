import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionClientBase } from './SubmissionClientBase';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

declare var XDomainRequest:{ new (); create(); };

export class DefaultSubmissionClient extends SubmissionClientBase {
  private createRequest(method:string, url:string): XMLHttpRequest {
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
      if (method === 'POST' && xhr.setRequestHeader) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }

      xhr.timeout = 10000;
    }

    return xhr;
  }

  public sendRequest(method:string, host:string, path:string, apiKey:string, data:string, callback: (status:number, message:string, data?:string) => void): void {
    var isCompleted = false;
    function complete(xhr:XMLHttpRequest) {
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

      callback(xhr.status || 500, message, xhr.responseText);
    }

    var url = `${host}${path}?access_token=${encodeURIComponent(apiKey)}`;
    var xhr = this.createRequest(method || 'POST', url);
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
