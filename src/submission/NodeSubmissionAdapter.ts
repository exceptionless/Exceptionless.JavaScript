import { ISubmissionAdapter } from './ISubmissionAdapter';
import { SubmissionCallback } from './SubmissionCallback';
import { SubmissionRequest } from './SubmissionRequest';

import http = require('http');
import https = require('https');
import url = require('url');
import child = require('child_process');

export class NodeSubmissionAdapter implements ISubmissionAdapter {
  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    if (isAppExiting) {
      this.sendRequestSync(request, callback);
      return;
    }

    let parsedHost = url.parse(request.url);

    let options: https.RequestOptions = {
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
        'Content-Length': new Buffer(request.data).length
      };
    }

    let protocol = (parsedHost.protocol === 'https' ? https : http);
    let clientRequest: http.ClientRequest = protocol.request(options, (response: http.IncomingMessage) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => this.complete(response, body, response.headers, callback));
    });

    clientRequest.on('error', (error: Error) => callback && callback(500, error.message));
    clientRequest.end(request.data);
  }

  private complete(response: http.IncomingMessage, responseBody: string, responseHeaders: Object, callback: SubmissionCallback): void {
    let message: string;
    if (response.statusCode === 0) {
      message = 'Unable to connect to server.';
    } else if (response.statusCode < 200 || response.statusCode > 299) {
      message = response.statusMessage || (<any>response).message;
    }

    callback && callback(response.statusCode || 500, message, responseBody, responseHeaders);
  }

  private sendRequestSync(request: SubmissionRequest, callback: SubmissionCallback): void {
    let requestJson = JSON.stringify(request);
    let res = child.spawnSync(process.execPath, [require.resolve('./submitSync.js')],
      {
        input: requestJson,
        stdio: ['pipe', 'pipe', process.stderr]
      });

    let out = res.stdout.toString();
    let result = JSON.parse(out);

    callback && callback(result.status, result.message, result.data, result.headers);
  }
}
