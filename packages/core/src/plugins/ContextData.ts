
const enum KnownContextKeys {
  Exception = "@@_Exception",
  IsUnhandledError = "@@_IsUnhandledError",
  SubmissionMethod = "@@_SubmissionMethod"
}

// TODO: Look into ways of improving this.
export class ContextData {
  public getException(): Error {
    return this[KnownContextKeys.Exception] || null;
  }

  public setException(exception: Error): void {
    if (exception) {
      this[KnownContextKeys.Exception] = exception;
    }
  }

  public get hasException(): boolean {
    return !!this[KnownContextKeys.Exception];
  }

  public markAsUnhandledError(): void {
    this[KnownContextKeys.IsUnhandledError] = true;
  }

  public get isUnhandledError(): boolean {
    return !!this[KnownContextKeys.IsUnhandledError];
  }

  public getSubmissionMethod(): string {
    return this[KnownContextKeys.SubmissionMethod] || null;
  }

  public setSubmissionMethod(method: string): void {
    if (method) {
      this[KnownContextKeys.SubmissionMethod] = method;
    }
  }
}
