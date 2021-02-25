import { ClientSettings } from "../configuration/SettingsManager.js";
import { IEvent } from '../models/IEvent.js';
import { IUserDescription } from '../models/IUserDescription.js';
import { Response } from "./Response";

export interface ISubmissionClient {
  getSettings(version: number): Promise<Response<ClientSettings>>;
  submitEvents(events: IEvent[]): Promise<Response<void>>;
  submitUserDescription(referenceId: string, description: IUserDescription): Promise<Response<void>>;
  submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response<void>>;
}
