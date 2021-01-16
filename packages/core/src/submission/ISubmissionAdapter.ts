import { SubmissionCallback } from './SubmissionCallback';
import { SubmissionRequest } from './SubmissionRequest';

export interface ISubmissionAdapter {
  sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean): void;
}
