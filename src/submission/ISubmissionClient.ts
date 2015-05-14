import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';

export interface ISubmissionClient {
  submit(events:IEvent[], config:Configuration, callback:(SubmissionResponse) => void):void;
  submitDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(SubmissionResponse) => void):void;
  getSettings(config:Configuration, callback:(SettingsResponse) => void):void;
}
