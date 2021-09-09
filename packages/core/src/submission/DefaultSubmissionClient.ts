import { Configuration } from "../configuration/Configuration.js";
import {
  ServerSettings,
  SettingsManager,
} from "../configuration/SettingsManager.js";
import { Event } from "../models/Event.js";
import { UserDescription } from "../models/data/UserDescription.js";
import { ISubmissionClient } from "./ISubmissionClient.js";
import { Response } from "./Response.js";

export class DefaultSubmissionClient implements ISubmissionClient {
  protected readonly RateLimitRemainingHeader: string = "x-ratelimit-remaining";
  protected readonly ConfigurationVersionHeader: string =
    "x-exceptionless-configversion";

  public constructor(protected config: Configuration, private fetch = globalThis.fetch?.bind(globalThis)) { }

  public getSettings(version: number): Promise<Response<ServerSettings>> {
    const url = `${this.config.serverUrl}/api/v2/projects/config?v=${version}`;
    return this.apiFetch<ServerSettings>(url, {
      method: "GET",
    });
  }

  public async submitEvents(events: Event[]): Promise<Response> {
    const url = `${this.config.serverUrl}/api/v2/events`;
    const response = await this.apiFetch(url, {
      method: "POST",
      body: JSON.stringify(events),
    });

    await this.updateSettingsVersion(response.settingsVersion);
    return response;
  }

  public async submitUserDescription(referenceId: string, description: UserDescription): Promise<Response> {
    const url = `${this.config.serverUrl}/api/v2/events/by-ref/${encodeURIComponent(referenceId)
      }/user-description`;

    const response = await this.apiFetch(url, {
      method: "POST",
      body: JSON.stringify(description),
    });

    await this.updateSettingsVersion(response.settingsVersion);

    return response;
  }

  public async submitHeartbeat(sessionIdOrUserId: string, closeSession: boolean): Promise<Response<void>> {
    const url = `${this.config.heartbeatServerUrl}/api/v2/events/session/heartbeat?id=${sessionIdOrUserId}&close=${closeSession + ""}`;
    return await this.apiFetch<void>(url, {
      method: "GET",
    });
  }

  protected async updateSettingsVersion(serverSettingsVersion: number): Promise<void> {
    if (isNaN(serverSettingsVersion)) {
      this.config.services.log.error("No config version header was returned.");
    } else if (serverSettingsVersion > this.config.settingsVersion) {
      await SettingsManager.updateSettings(this.config);
    }
  }

  protected async apiFetch<T = void>(url: string, options: FetchOptions): Promise<Response<T>> {
    // TODO: Figure out how to set a 10000 timeout.
    const requestOptions: RequestInit = {
      method: options.method,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "User-Agent": this.config.userAgent,
      },
      body: options.body ?? null
    };

    // TODO: Can we properly calculate content size?
    if (options.method === "POST" && this.isHeaders(requestOptions.headers)) {
      requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await this.fetch(url, requestOptions);
    const rateLimitRemaining: number = parseInt(response.headers.get(this.RateLimitRemainingHeader) || "", 10);
    const settingsVersion: number = parseInt(response.headers.get(this.ConfigurationVersionHeader) || "", 10);

    const responseText = await response.text();
    const data = responseText && responseText.length > 0 ? JSON.parse(responseText) as T : null;

    return new Response<T>(
      response.status,
      response.statusText,
      rateLimitRemaining,
      settingsVersion,
      <T>data,
    );
  }

  private isHeaders(headers: HeadersInit | undefined): headers is Record<string, string> {
    return (headers as Record<string, string>) !== undefined;
  }
}

export interface FetchOptions {
  method: "GET" | "POST";
  body?: string;
}
