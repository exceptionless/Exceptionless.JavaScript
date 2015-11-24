export class SubmissionResponse {
  success: boolean = false;
  badRequest: boolean = false;
  serviceUnavailable: boolean = false;
  paymentRequired: boolean = false;
  unableToAuthenticate: boolean = false;
  notFound: boolean = false;
  requestEntityTooLarge: boolean = false;
  statusCode: number;
  message: string;

  constructor(statusCode: number, message?: string) {
    this.statusCode = statusCode;
    this.message = message;

    this.success = statusCode >= 200 && statusCode <= 299;
    this.badRequest = statusCode === 400;
    this.serviceUnavailable = statusCode === 503;
    this.paymentRequired = statusCode === 402;
    this.unableToAuthenticate = statusCode === 401 || statusCode === 403;
    this.notFound = statusCode === 404;
    this.requestEntityTooLarge = statusCode === 413;
  }
}
