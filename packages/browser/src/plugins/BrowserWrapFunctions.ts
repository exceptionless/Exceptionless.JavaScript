import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class BrowserWrapFunctions implements IEventPlugin {
  public priority: number = 110;
  public name: string = "BrowserWrapFunctions";

  private _client: ExceptionlessClient = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    // TODO: TraceKit.extendToAsynchronousCallbacks();

    return Promise.resolve();
  }
}
