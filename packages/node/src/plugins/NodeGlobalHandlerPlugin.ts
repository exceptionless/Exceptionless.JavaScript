import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
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

    process.addListener("unhandledRejection", (reason: unknown | null | undefined, _: Promise<any>) => {
      void this._client?.submitUnhandledException(<Error>reason, "unhandledRejection");
    });

    return Promise.resolve();
  }
}
