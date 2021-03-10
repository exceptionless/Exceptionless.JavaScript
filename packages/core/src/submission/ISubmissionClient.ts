import { ClientSettings } from "../configuration/SettingsManager.js";
import { Event } from "../models/Event.js";
import { UserDescription } from "../models/data/UserDescription.js";
import { Response } from "./Response";

export interface ISubmissionClient {
  getSettings(version: number): Promise<Response<ClientSettings>>;
  submitEvents(events: Event[]): Promise<Response<void>>;
  submitUserDescription(referenceId: string, description: UserDescription): Promise<Response<void>>;
  submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response<void>>;
}
