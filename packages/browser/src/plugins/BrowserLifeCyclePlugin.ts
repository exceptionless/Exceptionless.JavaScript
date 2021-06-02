import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class BrowserLifeCyclePlugin implements IEventPlugin {
  public priority: number = 105;
  public name: string = "BrowserLifeCyclePlugin";

  private _client: ExceptionlessClient | undefined;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    globalThis.addEventListener("beforeunload", () => void this._client?.suspend());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'visible') {
        void this._client?.startup()
      } else {
        void this._client?.suspend()
      }
    });

    return Promise.resolve();
  }
}
