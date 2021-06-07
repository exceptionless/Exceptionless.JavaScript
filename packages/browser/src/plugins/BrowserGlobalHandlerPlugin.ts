import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

declare let $: (document: Document) => { ajaxError: { (document: (event: Event, xhr: { responseText: string; status: number; }, settings: { data: unknown; url: string; }, error: string) => void): void; }; };

export class BrowserGlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "BrowserGlobalHandlerPlugin";

  private _client: ExceptionlessClient | null = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    // TODO: Discus if we want to unwire this handler in suspend?
    window.addEventListener("error", event => {
      void this._client?.submitUnhandledException(this.getError(event), "onerror");
    });

    window.addEventListener("unhandledrejection", event => {
      let error = event.reason;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const reason = (<{ detail?: { reason: string} }>event).detail?.reason;
        if (reason) {
          error = reason;
        }
        // eslint-disable-next-line no-empty
      } catch (ex) { }

      void this._client?.submitUnhandledException(error, "onunhandledrejection");
    });


    if (typeof $ !== "undefined" && $(document)) {
      $(document).ajaxError((_: Event, xhr: { responseText: string, status: number }, settings: { data: unknown, url: string }, error: string) => {
        if (xhr.status === 404) {
          // TODO: Handle async
          void this._client?.submitNotFound(settings.url);
        } else if (xhr.status !== 401) {
          // TODO: Handle async
          void this._client?.createUnhandledException(new Error(error), "JQuery.ajaxError")
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

  private getError(event: ErrorEvent): Error {
    const { error, message, filename, lineno, colno } = event;
    if (typeof error === "object") {
      return error as Error;
    }

    let name: string = "Error";
    let msg: string = message || event.error;
    if (msg) {
      const errorNameRegex: RegExp = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Aggregate|Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
      const regexResult = errorNameRegex.exec(msg);
      if (regexResult) {
        const [, errorName, errorMessage] = regexResult;
        if (errorName) {
          name = errorName;
        }
        if (errorMessage) {
          msg = errorMessage;
        }
      }
    }

    const ex = new Error(msg || "Script error.");
    ex.name = name;
    ex.stack = `at ${filename || ""}:${!isNaN(lineno) ? lineno : 0}${!isNaN(colno) ? `:${colno}` : ""}`;
    return ex;
  }
}
