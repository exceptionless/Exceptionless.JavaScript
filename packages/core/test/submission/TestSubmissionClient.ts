import { Response } from "../../src/submission/Response.js";
import {
  DefaultSubmissionClient
} from "../../src/submission/DefaultSubmissionClient.js";

export class TestSubmissionClient extends DefaultSubmissionClient {
  public apiFetch<T>(): Promise<Response<T>> {
    throw new Error("Missing mock");
  }
}
