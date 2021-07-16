import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class BrowserLifeCyclePlugin implements IEventPlugin {
  public priority: number = 105;
  public name: string = "BrowserLifeCyclePlugin";

  private _client: ExceptionlessClient | null = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client || typeof document !== "object") {
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
