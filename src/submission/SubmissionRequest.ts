export interface SubmissionRequest {
  serverUrl: string;
  apiKey: string;
  userAgent: string;
  method: string;
  path: string;
  data: string;
}
