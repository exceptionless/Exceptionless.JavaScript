import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class NodeWrapFunctions implements IEventPlugin {
  public priority: number = 110;
  public name: string = "NodeWrapFunctions";

  private _client: ExceptionlessClient | undefined;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    // TODO: TraceKit.extendToAsynchronousCallbacks();

    return Promise.resolve();
  }
}
