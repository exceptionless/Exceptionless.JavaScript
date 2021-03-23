import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class LifeCyclePlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "LifeCyclePlugin";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return;
    }

    this._client = context.client;
    globalThis.addEventListener("beforeunload", async () => await this._client.processQueue());
    return Promise.resolve();
  }
}
