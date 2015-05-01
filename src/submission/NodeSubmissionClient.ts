import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

import http = require('http');
import https = require('https');

export class NodeSubmissionClient implements ISubmissionClient {
  public submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse> {
    var path = `/api/v2/events?access_token=${encodeURIComponent(config.apiKey)}`;
    return this.sendRequest('POST', config.serverUrl, path, Utils.stringify(events)).then(
      msg => { return new SubmissionResponse(msg.statusCode, this.getResponseMessage(msg)); },
      msg => { return new SubmissionResponse(msg.statusCode || 500, this.getResponseMessage(msg)); }
    );
  }

  public submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse> {
    var path = `/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description?access_token=${encodeURIComponent(config.apiKey)}`;
    return this.sendRequest('POST', config.serverUrl, path, Utils.stringify(description)).then(
      msg => { return new SubmissionResponse(msg.statusCode, this.getResponseMessage(msg)); },
      msg => { return new SubmissionResponse(msg.statusCode || 500, this.getResponseMessage(msg)); }
    );
  }

  public getSettings(config:Configuration): Promise<SettingsResponse> {
    var path = config.serverUrl + '/api/v2/projects/config?access_token=' + encodeURIComponent(config.apiKey);
    return this.sendRequest('GET', config.serverUrl, path).then(
      msg => {
        if (msg.statusCode !== 200 || !(<any>msg).responseText) {
          return new SettingsResponse(false, null, -1, null, `Unable to retrieve configuration settings: ${this.getResponseMessage(msg)}`);
        }

        var settings;
        try {
          settings = JSON.parse((<any>msg).responseText);
        } catch (e) {
          config.log.error(`An error occurred while parsing the settings response text: "${(<any>msg).responseText}"`);
        }

        if (!settings || !settings.settings || !settings.version) {
          return new SettingsResponse(true, null, -1, null, 'Invalid configuration settings.');
        }

        return new SettingsResponse(true, settings.settings, settings.version);
      },
      msg => {
        return new SettingsResponse(false, null, -1, null, this.getResponseMessage(msg));
      }
    );
  }

  private getResponseMessage(msg:http.IncomingMessage): string {
    if (!msg || (msg.statusCode >= 200 && msg.statusCode <= 299)) {
      return null;
    }

    if (msg.statusCode === 0) {
      return 'Unable to connect to server.';
    }

    return msg.statusMessage || (<any>msg).message;
  }

  private sendRequest(method:string, host:string, path:string, data?:string): Promise<http.IncomingMessage> {
    return new Promise((resolve, reject) => {
      var options:https.RequestOptions = {
        host: host,
        method: method,
        port: 443, // TODO: Detect if the host is secure.
        path: path
      };

      if (method === 'POST') {
        options.headers = {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
        }
      }

      var request:http.ClientRequest = https.request(options, (response:http.IncomingMessage) => {
        var body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          (<any>response).responseText = body;
          resolve(response);
        });
      });

      request.on('error', function(e) {
        reject(e)
      });

      request.write(data);
      request.end();
    });
  }
}
