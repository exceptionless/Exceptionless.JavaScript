import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class BrowserLifeCyclePlugin implements IEventPlugin {
  public priority: number = 105;
  public name: string = "BrowserLifeCyclePlugin";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    globalThis.addEventListener("beforeunload", async () => await this._client.suspend());
    document.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === 'visible') {
        await this._client.startup()
      } else {
        await this._client.suspend()
      }
    });

    return Promise.resolve();
  }
}
