/// <reference path="../references.ts" />

module Exceptionless {
  export class DefaultSubmissionClient implements ISubmissionClient {
    public submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse> {
      var url = config.serverUrl + '/api/v2/events?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('POST', url, JSON.stringify(events)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

    public submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse> {
      var url = config.serverUrl + '/api/v2/events/by-ref/' + encodeURIComponent(referenceId) + '/user-description?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('POST', url, JSON.stringify(description)).then(
          xhr => { return new SubmissionResponse(xhr.status, this.getResponseMessage(xhr)); },
          xhr => { return new SubmissionResponse(xhr.status || 500, this.getResponseMessage(xhr)); }
      );
    }

    public getSettings(config:Configuration): Promise<SettingsResponse> {
      var url = config.serverUrl + '/api/v2/projects/config?access_token=' + encodeURIComponent(config.apiKey);
      return this.sendRequest('GET', url).then(
          xhr => {
          if (xhr.status !== 200) {
            return new SettingsResponse(false, null, -1, null, 'Unable to retrieve configuration settings: ' + this.getResponseMessage(xhr));
          }

          var settings;
          try {
            settings = JSON.parse(xhr.responseText);
          } catch (e) {
            config.log.error('An error occurred while parsing the settings response text: "' + xhr.responseText + '"');
          }

          if (!settings || !settings.settings || !settings.version) {
            return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
          }

          return new SettingsResponse(true, settings.settings, settings.version);
        },
          xhr => {
          return new SettingsResponse(false, null, -1, null, this.getResponseMessage(xhr));
        }
      );
    }

    private getResponseMessage(xhr:XMLHttpRequest): string {
      if (!xhr || (xhr.status >= 200 && xhr.status <= 299)) {
        return null;
      }

      if (xhr.status === 0) {
        return 'Unable to connect to server.';
      }

      if (xhr.responseBody) {
        return xhr.responseBody.message;
      }

      if (xhr.responseText) {
        try {
          return JSON.parse(xhr.responseText).message;
        } catch (e) {
          return xhr.responseText;
        }
      }

      return  xhr.statusText;
    }

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

    private sendRequest(method:string, url:string, data?:string): Promise<any> {
      var xhr = this.createRequest(method || 'POST', url);

      return new Promise((resolve, reject) => {
        if (!xhr) {
          return reject({ status: 503, message: 'CORS not supported.' });
        }

        if ('withCredentials' in xhr) {
          xhr.onreadystatechange = () => {
            // xhr not ready.
            if (xhr.readyState !== 4) {
              return;
            }

            if (xhr.status >= 200 && xhr.status <= 299) {
              resolve(xhr);
            } else {
              reject(xhr);
            }
          };
        }

        xhr.ontimeout = () => reject(xhr);
        xhr.onerror = () => reject(xhr);
        xhr.onload = () => resolve(xhr);

        xhr.send(data);
      });
    }
  }
}
