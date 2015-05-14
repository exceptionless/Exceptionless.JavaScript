import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionClientBase } from './SubmissionClientBase';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

import http = require('http');
import https = require('https');
import url = require('url');

export class NodeSubmissionClient extends SubmissionClientBase {
  public sendRequest(method:string, host:string, path:string, apiKey:string, data:string, callback: (status:number, message:string, data?:string) => void): void {
    function complete(response:http.IncomingMessage, data:string) {
      var message:string;
      if (response.statusCode === 0) {
        message = 'Unable to connect to server.';
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        message = response.statusMessage || (<any>response).message;
      }

      callback(response.statusCode || 500, message, data);
    }

    var parsedHost = url.parse(host);
    var options:https.RequestOptions = {
      auth: `client:${apiKey}`,
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

    var request:http.ClientRequest = https.request(options, (response:http.IncomingMessage) => {
      var body = '';
      response.on('data', chunk => body += chunk);
      response.on('end', () => {
        complete(response, body);
      });
    });

    request.on('error', function(e) {
      callback(500, e.message);
    });

    request.write(data);
    request.end();
  }
}
