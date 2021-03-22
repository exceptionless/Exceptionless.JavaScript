import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class GlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "GlobalHandlerPlugin";

  private client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = context.client;
    Error.stackTraceLimit = Infinity;

    // TODO: Discus if we want to unwire this handler in suspend?
    const originalOnError: OnErrorEventHandlerNonNull = globalThis.onerror;
    globalThis.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error): any => {
      /*
      const builder = this.client.createUnhandledException(new Error(stackTrace.message || (options || {}).status || "Script error"), "onerror");
      builder.pluginContextData["@@_TraceKit.StackTrace"] = stackTrace;
      void builder.submit(); // TODO: Handle async?
      */

      // eslint-disable-next-line prefer-rest-params
      return originalOnError ? originalOnError.apply(this, ...arguments) : false;
    };

    return Promise.resolve();
  }
}
