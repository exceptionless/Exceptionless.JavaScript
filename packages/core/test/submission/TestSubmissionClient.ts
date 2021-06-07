import { Response } from "../../src/submission/Response.js";
import {
  FetchOptions,
  DefaultSubmissionClient
} from "../../src/submission/DefaultSubmissionClient.js";

export class TestSubmissionClient extends DefaultSubmissionClient {
  public apiFetch<T>(_url: string, _options: FetchOptions): Promise<Response<T>> {
    throw new Error("Missing mock");
  }
}
