import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';

export interface ISubmissionClient {
  postEvents(events:IEvent[], config:Configuration, callback:(response:SubmissionResponse) => void, isAppExiting?:boolean):void;
  postUserDescription(referenceId:string, description:IUserDescription, config:Configuration, callback:(response:SubmissionResponse) => void):void;
  getSettings(config:Configuration, callback:(response:SettingsResponse) => void):void;
}
