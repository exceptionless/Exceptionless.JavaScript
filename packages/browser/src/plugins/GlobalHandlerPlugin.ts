import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext,
  nameof
} from "@exceptionless/core";

export class GlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "GlobalHandlerPlugin";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return;
    }

    this._client = context.client;
    Error.stackTraceLimit = Infinity;

    // TODO: Discus if we want to unwire this handler in suspend?
    const originalOnError: OnErrorEventHandlerNonNull = globalThis.onerror;
    globalThis.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      // TODO: Handle async
      void this._client.submitUnhandledException(error || this.buildError(event, source, lineno, colno), nameof<Window>("onerror"));

      // eslint-disable-next-line prefer-rest-params
      return originalOnError ? originalOnError.apply(this, ...arguments) : false;
    };

    const originalOnunhandledrejection = globalThis.onunhandledrejection;
    globalThis.onunhandledrejection = (pre: PromiseRejectionEvent) => {
      let error = pre.reason;
      try {
        const reason = (<any>pre).detail?.reason;
        if (reason) {
          error = reason;
        }
        // eslint-disable-next-line no-empty
      } catch (ex) { }

      // TODO: Handle async
      void this._client.submitUnhandledException(error, nameof<Window>("onunhandledrejection"));

      // eslint-disable-next-line prefer-rest-params
      return originalOnunhandledrejection ? originalOnunhandledrejection.apply(this, ...arguments) : false;
    };

    return Promise.resolve();
  }

  private buildError(event: Event | string, source?: string, lineno?: number, colno?: number): Error {
    let name: string = "Error";
    let message: string = Object.prototype.toString.call(event) === '[object ErrorEvent]' ? (<ErrorEvent>event).message : null;
    if (message) {
      const errorNameRegex: RegExp = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Aggregate|Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$)/i;
      const [_, errorName, errorMessage] = errorNameRegex.exec(message);
      if (errorName) {
        name = errorName;
      }
      if (errorMessage) {
        message = errorMessage;
      }
    }

    const error = new Error(message || "Script error");
    error.name = name;
    error.stack = `at ${source || ""}:${!isNaN(lineno) ? lineno : 0}${!isNaN(colno) ? ":" + colno : ""}`;
    return error;
  }
}
