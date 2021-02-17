import { SubmissionCallback } from './SubmissionCallback.js';
import { SubmissionRequest } from './SubmissionRequest.js';

export interface ISubmissionAdapter {
  sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean): void;
}
