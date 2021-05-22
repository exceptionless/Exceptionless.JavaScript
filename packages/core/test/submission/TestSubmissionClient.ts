import { Response } from "../../src/submission/Response.js";
import {
  FetchOptions,
  DefaultSubmissionClient
} from "../../src/submission/DefaultSubmissionClient.js";

export class TestSubmissionClient extends DefaultSubmissionClient {
  public fetch<T>(url: string, options: FetchOptions): Promise<Response> {
    throw new Error("Missing mock");
  }
}
