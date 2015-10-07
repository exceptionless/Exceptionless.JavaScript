import http = require('http');
import https = require('https');
import url = require('url');

export interface NodeSubmissionCallback {
  (status: number, message: string, data?: string, headers?: Object): void
}

export interface NodeSubmissionRequest {
  serverUrl: string;
  apiKey: string;
  userAgent: string;
  method: string;
  path: string;
  data: string;
}

function complete(response: http.IncomingMessage, responseBody: string, responseHeaders: Object, callback:NodeSubmissionCallback): void {
    var message: string;
    if(response.statusCode === 0) {
    message = 'Unable to connect to server.';
    } else if (response.statusCode < 200 || response.statusCode > 299) {
    message = response.statusMessage || (<any>response).message;
    }

    callback(response.statusCode || 500, message, responseBody, responseHeaders);
}

export function submitRequest(request: NodeSubmissionRequest, callback: NodeSubmissionCallback): void {
  var parsedHost = url.parse(request.serverUrl);

  var options: https.RequestOptions = {
    auth: `client:${request.apiKey}`,
    headers: {},
    hostname: parsedHost.hostname,
    method: request.method,
    port: parsedHost.port && parseInt(parsedHost.port),
    path: request.path
  };

  options.headers['User-Agent'] = request.userAgent;

  if (request.method === 'POST') {
    options.headers = {
      'Content-Type': 'application/json',
      'Content-Length': request.data.length
    }
  }

  var protocol = (parsedHost.protocol === 'https' ? https : http);
  var clientRequest: http.ClientRequest = protocol.request(options, (response: http.IncomingMessage) => {
    var body = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => body += chunk);
    response.on('end', () => complete(response, body, response.headers, callback));
  });

  clientRequest.on('error', (error: Error) => callback(500, error.message));
  clientRequest.end(request.data);
}
