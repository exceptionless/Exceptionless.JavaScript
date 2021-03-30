import {
  FetchOptions,
  Response,
  SubmissionClientBase
} from "@exceptionless/core";

export class BrowserFetchSubmissionClient extends SubmissionClientBase {
  protected async fetch<T>(url: string, options: FetchOptions): Promise<Response<T>> {
    // TODO: Figure out how to set a 10000 timeout.
    const requestOptions: RequestInit = {
      method: options.method,
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${this.config.apiKey}`,
        "User-Agent": this.config.userAgent
      },
      body: options.body
    };

    // TODO: Can we properly calculate content size?
    if (options.method === "POST") {
      requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, requestOptions);
    const settingsVersion: number = parseInt(response.headers.get(this.ConfigurationVersionHeader), 10);
    return new Response(response.status, response.statusText, settingsVersion, response.ok ? await response.json() : await response.text())
  }
}
