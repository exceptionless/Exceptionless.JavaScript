import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { DefaultSubmissionClient } from './DefaultSubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

import http = require('http');
import https = require('https');
import url = require('url');

export class NodeSubmissionClient extends DefaultSubmissionClient {
  constructor() {
    super();
    this.configurationVersionHeader = this.configurationVersionHeader.toLowerCase();
  }

  public sendRequest(config:Configuration, method:string, path:string, data:string, callback: (status:number, message:string, data?:string, headers?:Object) => void): void {
    function complete(response:http.IncomingMessage, responseBody:string, responseHeaders:Object) {
      var message:string;
      if (response.statusCode === 0) {
        message = 'Unable to connect to server.';
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        message = response.statusMessage || (<any>response).message;
      }

      callback(response.statusCode || 500, message, responseBody, responseHeaders);
    }

    var parsedHost = url.parse(config.serverUrl);
    var options:https.RequestOptions = {
      auth: `client:${config.apiKey}`,
      headers: {},
      hostname: parsedHost.hostname,
      method: method,
      port: parsedHost.port && parseInt(parsedHost.port),
      path: path
    };

    if (method === 'POST') {
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }
    
    options.headers['User-Agent'] = config.userAgent;
    var request:http.ClientRequest = (parsedHost.protocol === 'https' ? https : http).request(options, (response:http.IncomingMessage) => {
      var body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => complete(response, body, response.headers));
    });

    request.on('error', (error:Error) => callback(500, error.message));
    request.end(data);
  }
}
