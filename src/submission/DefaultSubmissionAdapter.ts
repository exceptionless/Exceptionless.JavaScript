import { ISubmissionAdapter } from './ISubmissionAdapter';
import { SubmissionCallback } from './SubmissionCallback';
import { SubmissionRequest } from './SubmissionRequest';

// tslint:disable-next-line:prefer-const
declare var XDomainRequest: { new (); create(); };

export class DefaultSubmissionAdapter implements ISubmissionAdapter {
  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    // TODO: Handle sending events when app is exiting with send beacon.
    const TIMEOUT: string = 'timeout';  // optimization for minifier.
    const LOADED: string = 'loaded';  // optimization for minifier.
    const WITH_CREDENTIALS: string = 'withCredentials';  // optimization for minifier.

    let isCompleted: boolean = false;
    let useSetTimeout: boolean = false;
    function complete(mode: string, xhr: XMLHttpRequest) {
      function parseResponseHeaders(headerStr) {
        function trim(value) {
          return value.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }

        const headers = {};
        const headerPairs = (headerStr || '').split('\u000d\u000a');
        for (const headerPair of headerPairs) {
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          const separator = headerPair.indexOf('\u003a\u0020');
          if (separator > 0) {
            headers[trim(headerPair.substring(0, separator).toLowerCase())] = headerPair.substring(separator + 2);
          }
        }

        return headers;
      }

      if (isCompleted) {
        return;
      }

      isCompleted = true;

      let message: string = xhr.statusText;
      const responseText: string = xhr.responseText;
      let status: number = xhr.status;

      if (mode === TIMEOUT || status === 0) {
        message = 'Unable to connect to server.';
        status = 0;
      } else if (mode === LOADED && !status) {
        status = request.method === 'POST' ? 202 : 200;
      } else if (status < 200 || status > 299) {
        const responseBody: any = (xhr as any).responseBody;
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

      callback && callback(status || 500, message || '', responseText, parseResponseHeaders(xhr.getAllResponseHeaders && xhr.getAllResponseHeaders()));
    }

    function createRequest(userAgent: string, method: string, url: string): XMLHttpRequest {
      let xhr: any = new XMLHttpRequest();
      if (WITH_CREDENTIALS in xhr) {
        xhr.open(method, url, true);

        xhr.setRequestHeader('X-Exceptionless-Client', userAgent);
        if (method === 'POST') {
          xhr.setRequestHeader('Content-Type', 'application/json');
        }
      } else if (typeof XDomainRequest !== 'undefined') {
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

    const url = `${request.url}${(request.url.indexOf('?') === -1 ? '?' : '&')}access_token=${encodeURIComponent(request.apiKey)}`;
    const xhr = createRequest(request.userAgent, request.method || 'POST', url);
    if (!xhr) {
      return (callback && callback(503, 'CORS not supported.'));
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
