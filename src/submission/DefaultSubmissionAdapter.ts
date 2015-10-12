import { ISubmissionAdapter } from './ISubmissionAdapter';
import { SubmissionCallback } from './SubmissionCallback';
import { SubmissionRequest } from './SubmissionRequest';

declare var XDomainRequest: { new (); create(); };

export class DefaultSubmissionAdapter implements ISubmissionAdapter {
  public sendRequest(request: SubmissionRequest, callback: SubmissionCallback) {
    const TIMEOUT: string = 'timeout';  // optimization for minifier.
    const LOADED: string = 'loaded';  // optimization for minifier.
    const WITH_CREDENTIALS: string = 'withCredentials';  // optimization for minifier.

    var isCompleted: boolean = false;
    var useSetTimeout: boolean = false;
    function complete(mode: string, xhr: XMLHttpRequest) {
      function parseResponseHeaders(headerStr) {
        var headers = {};
        var headerPairs = (headerStr || '').split('\u000d\u000a');
        for (var index: number = 0; index < headerPairs.length; index++) {
          var headerPair = headerPairs[index];
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          var separator = headerPair.indexOf('\u003a\u0020');
          if (separator > 0) {
            headers[headerPair.substring(0, separator)] = headerPair.substring(separator + 2).toLowerCase();
          }
        }

        return headers;
      }

      if (isCompleted) {
        return;
      }

      isCompleted = true;

      var message: string = xhr.statusText;
      var responseText: string = xhr.responseText;
      var status: number = xhr.status;

      if (mode === TIMEOUT || status === 0) {
        message = 'Unable to connect to server.';
        status = 0;
      } else if (mode === LOADED && !status) {
        status = request.method === 'POST' ? 202 : 200;
      } else if (status < 200 || status > 299) {
        var responseBody: any = xhr.responseBody;
        if (!!responseBody && !!responseBody.message) {
          message = responseBody.message;
        } else if (!!responseText && responseText.indexOf('message') !== -1) {
          try {
            message = JSON.parse(responseText).message;
          } catch (e) {
            message = responseText;
          }
        }
      }

      callback(status || 500, message || '', responseText, parseResponseHeaders(xhr.getAllResponseHeaders && xhr.getAllResponseHeaders()));
    }

    function createRequest(userAgent:string, method: string, url: string): XMLHttpRequest {
      var xhr: any = new XMLHttpRequest();
      if (WITH_CREDENTIALS in xhr) {
        xhr.open(method, url, true);

        xhr.setRequestHeader('X-Exceptionless-Client', userAgent);
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

    var url = `${request.serverUrl}${request.path}?access_token=${encodeURIComponent(request.apiKey) }`;
    var xhr = createRequest(request.userAgent, request.method || 'POST', url);
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

    xhr.onprogress = () => { };
    xhr.ontimeout = () => complete(TIMEOUT, xhr);
    xhr.onerror = () => complete('error', xhr);
    xhr.onload = () => complete(LOADED, xhr);

    if (useSetTimeout) {
      setTimeout(() => xhr.send(request.data), 500);
    } else {
      xhr.send(request.data);
    }
  }
}
