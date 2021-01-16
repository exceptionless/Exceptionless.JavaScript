export class SubmissionResponse {
  public success: boolean = false;
  public badRequest: boolean = false;
  public serviceUnavailable: boolean = false;
  public paymentRequired: boolean = false;
  public unableToAuthenticate: boolean = false;
  public notFound: boolean = false;
  public requestEntityTooLarge: boolean = false;
  public statusCode: number;
  public message: string;

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
