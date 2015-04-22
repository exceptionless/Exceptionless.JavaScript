/// <reference path="../references.ts" />

module Exceptionless {
  export class ContextData {
    public setException(exception:Error): void {
      this['@@_Exception'] = exception;
    }

    public get hasException(): boolean {
      return !!this['@@_Exception']
    }

    public getException(): Error {
      if (!this.hasException) {
        return null;
      }

      return this['@@_Exception'];
    }

    public markAsUnhandledError(): void {
      this['@@_IsUnhandledError'] = true;
    }

    public get isUnhandledError(): boolean {
      return !!this['@@_IsUnhandledError'];
    }

    public setSubmissionMethod(method:string): void {
      this['@@_SubmissionMethod'] = method;
    }

    public getSubmissionMethod(): string {
      if (!!this['@@_SubmissionMethod']) {
        return null;
      }

      return this['@@_SubmissionMethod'];
    }
  }
}
