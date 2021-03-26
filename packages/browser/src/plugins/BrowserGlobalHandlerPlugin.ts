import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

declare var $: (document: Document) => { (): any; new(): any; ajaxError: { (document: (event: Event, xhr: { responseText: string; status: number; }, settings: { data: unknown; url: string; }, error: string) => void): void; new(): any; }; };

export class BrowserGlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "BrowserGlobalHandlerPlugin";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;
    Error.stackTraceLimit = 50;

    // TODO: Discus if we want to unwire this handler in suspend?
    const originalOnError: OnErrorEventHandler = globalThis.onerror;
    globalThis.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      // TODO: Handle async
      void this._client.createUnhandledException(error || this.buildError(event, source, lineno, colno), "onerror")
        .setSource(source)
        .submit();

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
      void this._client.submitUnhandledException(error, "onunhandledrejection");

      // eslint-disable-next-line prefer-rest-params
      return originalOnunhandledrejection ? originalOnunhandledrejection.apply(this, ...arguments) : false;
    };

    if (typeof $ !== "undefined" && $(document)) {
      $(document).ajaxError((event: Event, xhr: { responseText: string, status: number }, settings: { data: unknown, url: string }, error: string) => {
        if (xhr.status === 404) {
          // TODO: Handle async
          void this._client.submitNotFound(settings.url);
        } else if (xhr.status !== 401) {
          // TODO: Handle async
          void this._client.createUnhandledException(new Error(error), "JQuery.ajaxError")
            .setSource(settings.url)
            .setProperty("status", xhr.status)
            .setProperty("request", settings.data)
            .setProperty("response", xhr.responseText?.slice(0, 1024))
            .submit();
        }
      });
    }

    return Promise.resolve();
  }

  private buildError(event: Event | string, source?: string, lineno?: number, colno?: number): Error {
    if (Object.prototype.toString.call(event) === "[object ErrorEvent]") {
      // TODO: See if this is the error event.
      return (<ErrorEvent>event).error;
    }

    let name: string = "Error";
    let message: string = Object.prototype.toString.call(event) === '[object ErrorEvent]' ? (<ErrorEvent>event).error : null;
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

    const error = new Error(message || "Script error.");
    error.name = name;
    error.stack = `at ${source || ""}:${!isNaN(lineno) ? lineno : 0}${!isNaN(colno) ? ":" + colno : ""}`;
    return error;
  }
}
