import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext,
  toError
} from "@exceptionless/core";

export class NodeGlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "NodeGlobalHandlerPlugin";

  private _client: ExceptionlessClient | null = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;
    Error.stackTraceLimit = 50;

    process.addListener("uncaughtException", (error: Error) => {
      void this._client?.submitUnhandledException(error, "uncaughtException");
    });

    process.addListener("unhandledRejection", (reason: unknown) => {
      const error: Error = toError(reason, "Unhandled rejection")
      void this._client?.submitUnhandledException(error, "unhandledRejection");
    });

    return Promise.resolve();
  }
}
