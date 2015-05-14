import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

export class SubmissionClientBase implements ISubmissionClient {
  public submit(events:IEvent[], config:Configuration, callback:(SubmissionResponse) => void):void {
    return this.sendRequest('POST', config.serverUrl, '/api/v2/events', config.apiKey, Utils.stringify(events), (status:number, message:string, data:string) => {
      callback(new SubmissionResponse(status, message));
    });
  }

  public submitDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(SubmissionResponse) => void):void {
    var path = `/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description`;
    return this.sendRequest('POST', config.serverUrl, path, config.apiKey, Utils.stringify(description), (status:number, message:string, data:string) => {
      callback(new SubmissionResponse(status, message));
    });
  }

  public getSettings(config:Configuration, callback:(SettingsResponse) => void):void {
    return this.sendRequest('GET', config.serverUrl, '/api/v2/projects/config', config.apiKey, null, (status:number, message:string, data:string) => {
        if (status !== 200) {
          return callback(new SettingsResponse(false, null, -1, null, message));
        }

        var settings;
        try {
          settings = JSON.parse(data);
        } catch (e) {
          config.log.error(`Unable to parse settings: '${data}'`);
        }

        if (!settings || !settings.settings || !settings.version) {
          return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
        }

        callback(new SettingsResponse(true, settings.settings, settings.version));
    });
  }

  public sendRequest(method:string, host:string, path:string, data:string, apiKey:string, callback: (status:number, message:string, data?:string) => void): void {
    callback(500, 'Not Implemented');
  }
}
