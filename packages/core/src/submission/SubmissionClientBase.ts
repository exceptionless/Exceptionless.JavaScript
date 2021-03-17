import { Configuration } from "../configuration/Configuration.js";
import {
  ClientSettings,
  SettingsManager,
} from "../configuration/SettingsManager.js";
import { Event } from "../models/Event.js";
import { UserDescription } from "../models/data/UserDescription.js";
import { ISubmissionClient } from "./ISubmissionClient";
import { Response } from "./Response";

export interface FetchOptions {
  method: "GET" | "POST";
  body?: string;
}

export abstract class SubmissionClientBase implements ISubmissionClient {
  protected readonly ConfigurationVersionHeader: string = "x-exceptionless-configversion";

  public constructor(protected config: Configuration) { }

  public getSettings(version: number): Promise<Response<ClientSettings>> {
    const url = `${this.config.serverUrl}/api/v2/projects/config?v=${version}`;
    return this.fetch<ClientSettings>(url, {
      method: "GET",
    });
  }

  public async submitEvents(events: Event[]): Promise<Response<void>> {
    const url = `${this.config.serverUrl}/api/v2/events`;
    const response = await this.fetch<void>(url, {
      method: "POST",
      body: JSON.stringify(events)
    });

    await this.updateSettingsVersion(response.settingsVersion);
    return response;
  }

  public async submitUserDescription(referenceId: string, description: UserDescription): Promise<Response<void>> {
    const url = `${this.config.serverUrl}/api/v2/events/by-ref/${
      encodeURIComponent(referenceId)
    }/user-description`;

    const response = await this.fetch<void>(url, {
      method: "POST",
      body: JSON.stringify(description),
    });

    await this.updateSettingsVersion(response.settingsVersion);
    return response;
  }

  public async submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response<void>> {
    const url = `${this.config.heartbeatServerUrl}/api/v2/events/session/heartbeat?id=${sessionIdOrUserId}&close=${closeSession}`;

    const response = await this.fetch<void>(url, {
      method: "GET"
    });

    await this.updateSettingsVersion(response.settingsVersion);
    return response;
  }

  protected async updateSettingsVersion(settingsVersion: number): Promise<void> {
    if (!isNaN(settingsVersion)) {
      await SettingsManager.checkVersion(settingsVersion, this.config);
    } else {
      this.config.services.log.error("No config version header was returned.");
    }
  }

  protected abstract fetch<T>(url: string, options: FetchOptions): Promise<Response<T>>;
}
