import { Configuration } from '../configuration/Configuration.js';
import { IEvent } from '../models/IEvent.js';
import { IUserDescription } from '../models/IUserDescription.js';
import { SettingsResponse } from './SettingsResponse.js';
import { SubmissionResponse } from './SubmissionResponse.js';

export interface ISubmissionClient {
  postEvents(events: IEvent[], config: Configuration, callback: (response: SubmissionResponse) => void, isAppExiting?: boolean): void;
  postUserDescription(referenceId: string, description: IUserDescription, config: Configuration, callback: (response: SubmissionResponse) => void): void;
  getSettings(config: Configuration, version: number, callback: (response: SettingsResponse) => void): void;
  sendHeartbeat(sessionIdOrUserId: string, closeSession: boolean, config: Configuration): void;
}
