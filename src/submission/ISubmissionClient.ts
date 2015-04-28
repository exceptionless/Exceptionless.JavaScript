import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';

export interface ISubmissionClient {
  submit(events:IEvent[], config:Configuration): Promise<SubmissionResponse>;
  submitDescription(referenceId:string, description:IUserDescription, config:Configuration): Promise<SubmissionResponse>;
  getSettings(config:Configuration): Promise<SettingsResponse>;
}
