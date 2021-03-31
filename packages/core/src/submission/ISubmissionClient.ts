import { ClientSettings } from "../configuration/SettingsManager.js";
import { Event } from "../models/Event.js";
import { UserDescription } from "../models/data/UserDescription.js";
import { Response } from "./Response.js";

export interface ISubmissionClient {
  getSettings(version: number): Promise<Response>;
  submitEvents(events: Event[]): Promise<Response>;
  submitUserDescription(referenceId: string, description: UserDescription): Promise<Response>;
  submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response>;
}
