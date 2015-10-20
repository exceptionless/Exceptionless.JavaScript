import { Configuration } from '../configuration/Configuration';
import { SettingsManager } from '../configuration/SettingsManager';
import { IEvent } from '../models/IEvent';
import { IClientConfiguration } from '../models/IClientConfiguration';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionRequest } from './SubmissionRequest';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

declare var XDomainRequest:{ new (); create(); };

export class DefaultSubmissionClient implements ISubmissionClient {
  public configurationVersionHeader:string = 'x-exceptionless-configversion';

  public postEvents(events:IEvent[], config:Configuration, callback:(response:SubmissionResponse) => void, isAppExiting?:boolean):void {
    let data = Utils.stringify(events, config.dataExclusions);
    let request = this.createRequest(config, 'POST', '/api/v2/events', data);
    let cb = this.createSubmissionCallback(config, callback);

    return config.submissionAdapter.sendRequest(request, cb, isAppExiting);
  }

  public postUserDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(response:SubmissionResponse) => void):void {
    let path = `/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description`;
    let data = Utils.stringify(description, config.dataExclusions);
    let request = this.createRequest(config, 'POST', path, data);
    let cb = this.createSubmissionCallback(config, callback);

    return config.submissionAdapter.sendRequest(request, cb);
  }

  public getSettings(config:Configuration, callback:(response:SettingsResponse) => void):void {
    let request = this.createRequest(config, 'GET', '/api/v2/projects/config');
    let cb = (status, message, data?, headers?) => {
      if (status !== 200) {
        return callback(new SettingsResponse(false, null, -1, null, message));
      }

      let settings:IClientConfiguration;
      try {
        settings = JSON.parse(data);
      } catch (e) {
        config.log.error(`Unable to parse settings: '${data}'`);
      }

      if (!settings || isNaN(settings.version)) {
        return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
      }

      callback(new SettingsResponse(true, settings.settings || {}, settings.version));
    };

    return config.submissionAdapter.sendRequest(request, cb);
  }

  private createRequest(config: Configuration, method: string, path: string, data: string = null): SubmissionRequest {
    return {
      method,
      path,
      data,
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
      userAgent: config.userAgent
    };
  }

  private createSubmissionCallback(config:Configuration, callback:(response:SubmissionResponse) => void) {
    return (status, message, data?, headers?) => {
      let settingsVersion:number = headers && parseInt(headers[this.configurationVersionHeader], 10);
      SettingsManager.checkVersion(settingsVersion, config);

      callback(new SubmissionResponse(status, message));
    };
  }
}
