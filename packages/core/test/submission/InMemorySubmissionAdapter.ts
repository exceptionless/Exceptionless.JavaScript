import { ISubmissionAdapter } from "../../src/submission/ISubmissionAdapter";
import { SubmissionCallback } from "../../src/submission/SubmissionCallback";
import { SubmissionRequest } from "../../src/submission/SubmissionRequest";

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
