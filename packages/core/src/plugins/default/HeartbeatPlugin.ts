import { UserInfo } from "../../models/data/UserInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "HeartbeatPlugin";

  private _interval: number;
  private _intervalId: any;

  constructor(heartbeatInterval: number = 30000) {
    // TODO: Can we pause this? What about on shutdown,
    this._interval = heartbeatInterval >= 30000 ? heartbeatInterval : 60000;
  }

  public run(context: EventPluginContext): Promise<void> {
    clearInterval(this._intervalId);

    const user: UserInfo = context.event.data[KnownEventDataKeys.UserInfo];
    if (user && user.identity) {
      // TODO: Fix awaiting promise.
      this._intervalId = setInterval(
        () => void context.client.submitSessionHeartbeat(user.identity),
        this._interval,
      );
    }

    return Promise.resolve();
  }
}
