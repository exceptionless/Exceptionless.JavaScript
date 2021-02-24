import { spawnSync } from 'child_process'

import {
  ClientRequest,
  IncomingHttpHeaders,
  IncomingMessage,
  request as httpRequest
} from 'http'

import {
  request as httpsRequest,
  RequestOptions
} from 'https'

import { URL } from 'url'

import {
  execPath,
  stderr
} from 'process';

import {
  ISubmissionAdapter,
  SubmissionCallback,
  SubmissionRequest
} from '@exceptionless/core';

export class NodeSubmissionAdapter implements ISubmissionAdapter {
  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    if (isAppExiting) {
      this.sendRequestSync(request, callback);
      return;
    }

    const parsedHost = new URL(request.url);
    const options: RequestOptions = {
      auth: `client:${request.apiKey}`,
      headers: {},
      hostname: parsedHost.hostname,
      method: request.method,
      port: parsedHost.port && parseInt(parsedHost.port, 10),
      path: request.url
    };

    options.headers['User-Agent'] = request.userAgent;

    if (request.method === 'POST') {
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(request.data)
      };
    }

    const requestImpl = parsedHost.protocol === 'https:' ? httpsRequest : httpRequest;
    const clientRequest: ClientRequest = requestImpl(options, (response: IncomingMessage) => {
      let body: string = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => this.complete(response, body, response.headers, callback));
    });

    clientRequest.on('error', (error: Error) => callback && callback(500, error.message));
    clientRequest.end(request.data);
  }

  private complete(response: IncomingMessage, responseBody: string, responseHeaders: IncomingHttpHeaders, callback: SubmissionCallback): void {
    let message: string;
    if (response.statusCode === 0) {
      message = 'Unable to connect to server.';
    } else if (response.statusCode < 200 || response.statusCode > 299) {
      message = response.statusMessage || (response as any).message;
    }

    callback && callback(response.statusCode || 500, message, responseBody, responseHeaders);
  }

  private sendRequestSync(request: SubmissionRequest, callback: SubmissionCallback): void {
    const requestJson = JSON.stringify(request);
    // TODO: Figure out how to remove require
    const res = spawnSync(execPath, [require.resolve('./submitSync.js')], {
      input: requestJson,
      stdio: ['pipe', 'pipe', stderr]
    });

    const out = res.stdout.toString();
    const result = JSON.parse(out);

    callback && callback(result.status, result.message, result.data, result.headers);
  }
}
