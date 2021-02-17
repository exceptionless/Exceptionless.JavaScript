import { Configuration } from '../configuration/Configuration.js';
import { SettingsManager } from '../configuration/SettingsManager.js';
import { IClientConfiguration } from '../models/IClientConfiguration.js';
import { IEvent } from '../models/IEvent.js';
import { IUserDescription } from '../models/IUserDescription.js';
import { ISubmissionClient } from './ISubmissionClient.js';
import { SettingsResponse } from './SettingsResponse.js';
import { SubmissionRequest } from './SubmissionRequest.js';
import { SubmissionResponse } from './SubmissionResponse.js';

export class DefaultSubmissionClient implements ISubmissionClient {
  public configurationVersionHeader: string = 'x-exceptionless-configversion';

  public postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void, isAppExiting?: boolean): void {
    const data = JSON.stringify(events);
    const request = this.createRequest(config, 'POST', `${config.serverUrl}/api/v2/events`, data);
    const cb = this.createSubmissionCallback(config, callback);

    return config.submissionAdapter.sendRequest(request, cb, isAppExiting);
  }

  public postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void {
    const path = `${config.serverUrl}/api/v2/events/by-ref/${encodeURIComponent(referenceId)}/user-description`;
    const data = JSON.stringify(description);
    const request = this.createRequest(config, 'POST', path, data);
    const cb = this.createSubmissionCallback(config, callback);

    return config.submissionAdapter.sendRequest(request, cb);
  }

  public getSettings(config: Configuration, version: number, callback: (response: SettingsResponse) => void): void {
    const request = this.createRequest(config, 'GET', `${config.configServerUrl}/api/v2/projects/config?v=${version}`);
    const cb = (status, message, data?) => {
      if (status !== 200) {
        return callback(new SettingsResponse(false, null, -1, null, message));
      }

      let settings: IClientConfiguration;
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

  public sendHeartbeat(sessionIdOrUserId: string, closeSession: boolean, config: Configuration): void {
    const request = this.createRequest(config, 'GET', `${config.heartbeatServerUrl}/api/v2/events/session/heartbeat?id=${sessionIdOrUserId}&close=${closeSession}`);
    config.submissionAdapter.sendRequest(request);
  }

  private createRequest(config: Configuration, method: string, url: string, data: string = null): SubmissionRequest {
    return {
      method,
      url,
      data,
      apiKey: config.apiKey,
      userAgent: config.userAgent
    };
  }

  private createSubmissionCallback(config: Configuration, callback: (response: SubmissionResponse) => void) {
    return (status, message, data?, headers?) => {
      const settingsVersion: number = headers && parseInt(headers[this.configurationVersionHeader], 10);
      if (!isNaN(settingsVersion)) {
        SettingsManager.checkVersion(settingsVersion, config);
      } else {
        config.log.error('No config version header was returned.');
      }

      callback(new SubmissionResponse(status, message));
    };
  }
}
