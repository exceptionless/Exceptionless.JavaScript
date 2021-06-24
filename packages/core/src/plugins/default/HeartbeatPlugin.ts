import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class HeartbeatPlugin implements IEventPlugin {
  public priority = 100;
  public name = "HeartbeatPlugin";

  private _interval: number;
  private _intervalId = 0;

  constructor(heartbeatInterval: number = 30000) {
    this._interval = heartbeatInterval >= 30000 ? heartbeatInterval : 60000;
  }

  public startup(): Promise<void> {
    clearInterval(this._intervalId);
    this._intervalId = 0;
    // TODO: Do we want to send a heartbeat for the last user?
    return Promise.resolve();
  }

  public suspend(): Promise<void> {
    clearInterval(this._intervalId);
    this._intervalId = 0;
    return Promise.resolve();
  }

  public run(context: EventPluginContext): Promise<void> {
    if (this._interval <= 0) {
      return Promise.resolve();
    }

    clearInterval(this._intervalId);
    this._intervalId = 0;

    const user = context.event.data?.[KnownEventDataKeys.UserInfo];
    if (user?.identity) {
      this._intervalId = setInterval(
        () => void context.client.submitSessionHeartbeat(<string>user.identity),
        this._interval,
      );
    }

    return Promise.resolve();
  }
}
