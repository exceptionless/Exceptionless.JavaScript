import { Configuration } from '../configuration/Configuration';
import { SettingsManager } from '../configuration/SettingsManager';
import { IEvent } from '../models/IEvent';
import { IClientConfiguration } from '../models/IClientConfiguration';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

export class SubmissionClientBase implements ISubmissionClient {
  public configurationVersionHeader:string = 'X-Exceptionless-ConfigVersion';

  public postEvents(events:IEvent[], config:Configuration, callback:(response:SubmissionResponse) => void):void {
    return this.sendRequest(config, 'POST', '/api/v2/events', Utils.stringify(events, config.dataExclusions), (status:number, message:string, data?:string, headers?:Object) => {
      var settingsVersion:number = headers && parseInt(headers[this.configurationVersionHeader]);
      SettingsManager.checkVersion(settingsVersion, config);

      callback(new SubmissionResponse(status, message));
    });
  }

  public postUserDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(response:SubmissionResponse) => void):void {
    var path = `/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description`;
    return this.sendRequest(config, 'POST', path, Utils.stringify(description, config.dataExclusions), (status:number, message:string, data?:string, headers?:Object) => {
      var settingsVersion:number = headers && parseInt(headers[this.configurationVersionHeader]);
      SettingsManager.checkVersion(settingsVersion, config);

      callback(new SubmissionResponse(status, message));
    });
  }

  public getSettings(config:Configuration, callback:(response:SettingsResponse) => void):void {
    return this.sendRequest(config, 'GET', '/api/v2/projects/config', null, (status:number, message:string, data?:string) => {
        if (status !== 200) {
          return callback(new SettingsResponse(false, null, -1, null, message));
        }

        var settings:IClientConfiguration;
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

  public sendRequest(config:Configuration, method:string, path:string, data:string,  callback: (status:number, message:string, data?:string, headers?:Object) => void): void {
    callback(500, 'Not Implemented');
  }
}
