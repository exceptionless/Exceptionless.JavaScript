import { Response } from "../../src/submission/Response.js";
import {
  FetchOptions,
  SubmissionClientBase
} from "../../src/submission/SubmissionClientBase.js";

export class TestSubmissionClient extends SubmissionClientBase {
  public fetch<T>(url: string, options: FetchOptions): Promise<Response<T>> {
    throw new Error("Missing mock");
  }
}
