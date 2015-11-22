export class ContextData {
  public setException(exception: Error): void {
    if (exception) {
      this['@@_Exception'] = exception;
    }
  }

  public get hasException(): boolean {
    return !!this['@@_Exception'];
  }

  public getException(): Error {
    return this['@@_Exception'] || null;
  }

  public markAsUnhandledError(): void {
    this['@@_IsUnhandledError'] = true;
  }

  public get isUnhandledError(): boolean {
    return !!this['@@_IsUnhandledError'];
  }

  public setSubmissionMethod(method: string): void {
    if (method) {
      this['@@_SubmissionMethod'] = method;
    }
  }

  public getSubmissionMethod(): string {
    return this['@@_SubmissionMethod'] || null;
  }
}
