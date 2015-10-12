export interface SubmissionCallback {
  (status: number, message: string, data?: string, headers?: Object): void
}
