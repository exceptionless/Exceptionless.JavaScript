import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

import { addListener } from "process";

export class NodeGlobalHandlerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "NodeGlobalHandlerPlugin";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;
    Error.stackTraceLimit = 50;

    addListener("uncaughtException", async (error: Error) => {
      await this._client.submitUnhandledException(error, "uncaughtException");
    });

    addListener("unhandledRejection", async (error: Error) => {
      await this._client.submitUnhandledException(error, "unhandledRejection");
    });

    return Promise.resolve();
  }
}
