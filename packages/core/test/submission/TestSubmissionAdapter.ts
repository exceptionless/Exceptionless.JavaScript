import { ISubmissionAdapter } from "../../src/submission/ISubmissionAdapter.js";
import { SubmissionCallback } from "../../src/submission/SubmissionCallback.js";
import { SubmissionRequest } from "../../src/submission/SubmissionRequest.js";

export class TestSubmissionAdapter implements ISubmissionAdapter {
  private request: SubmissionRequest;
  private checks: Array<(request: SubmissionRequest) => void> = [];
  private callback: SubmissionCallback;
  private status: number = 202;
  private message: string = null;
  private data: string;
  private headers: Record<string, string>;

  constructor(check: (request: SubmissionRequest) => void) {
    this.checks.push(check);
  }

  public withResponse(status: number, message: string, data?: string, headers?: Record<string, string>) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.headers = headers;
    return this;
  }

  public withCheck(check: (request: SubmissionRequest) => void) {
    this.checks.push(check);
    return this;
  }

  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    this.request = request;
    this.callback = callback;

    if (isAppExiting) {
      this.done();
    }
  }

  public done() {
    if (!this.request) {
      throw new Error('sendRequest hasn\'t been called.');
    }

    this.checks.forEach((c) => c(this.request));
    this.callback && this.callback(this.status, this.message, this.data, this.headers);
  }
}
