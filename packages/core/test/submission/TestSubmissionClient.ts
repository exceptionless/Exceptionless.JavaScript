import { Configuration } from "#/configuration/Configuration.js";
import { DefaultSubmissionClient, FetchOptions } from "#/submission/DefaultSubmissionClient.js";
import { Response } from "#/submission/Response.js";

export type ApiFetchMock = (url: string, options: FetchOptions) => Promise<Response<unknown>>;

export class TestSubmissionClient extends DefaultSubmissionClient {
  public constructor(
    protected config: Configuration,
    protected apiFetchMock: ApiFetchMock
  ) {
    super(config);
  }

  protected async apiFetch<T = void>(url: string, options: FetchOptions): Promise<Response<T>> {
    if (!this.apiFetchMock) {
      throw new Error("Missing mock");
    }

    const response = await this.apiFetchMock(url, options);
    return response as Response<T>;
  }
}
