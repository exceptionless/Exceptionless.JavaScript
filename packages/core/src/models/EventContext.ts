const enum KnownContextKeys {
  Exception = "@@_Exception",
  IsUnhandledError = "@@_IsUnhandledError",
  SubmissionMethod = "@@_SubmissionMethod"
}

export class EventContext implements Record<string, unknown> {
  [x: string]: unknown;

  public getException(): Error | null {
    return (this[KnownContextKeys.Exception] as Error) || null;
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

  public getSubmissionMethod(): string | null {
    return (this[KnownContextKeys.SubmissionMethod] as string) || null;
  }

  public setSubmissionMethod(method: string): void {
    if (method) {
      this[KnownContextKeys.SubmissionMethod] = method;
    }
  }
}
