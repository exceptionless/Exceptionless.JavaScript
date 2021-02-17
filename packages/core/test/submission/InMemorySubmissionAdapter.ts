import { ISubmissionAdapter } from "../../src/submission/ISubmissionAdapter.js";
import { SubmissionCallback } from "../../src/submission/SubmissionCallback.js";
import { SubmissionRequest } from "../../src/submission/SubmissionRequest.js";

export class InMemorySubmissionAdapter implements ISubmissionAdapter {
  private status: number = 202;
  private message: string = null;
  private data: string;
  private headers: Record<string, string>;

  constructor() {
  }

  public withResponse(status: number, message: string, data?: string, headers?: Record<string, string>) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.headers = headers;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    callback && callback(this.status, this.message, this.data, this.headers);
  }
}
