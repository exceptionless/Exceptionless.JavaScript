import { UserInfo } from "../../models/data/UserInfo.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "HeartbeatPlugin";

  private _interval: number;
  private _intervalId: any;

  constructor(heartbeatInterval: number = 30000) {
    this._interval = heartbeatInterval >= 30000 ? heartbeatInterval : 60000;
  }

  public run(context: EventPluginContext): Promise<void> {
    clearInterval(this._intervalId);

    const user: UserInfo = context.event.data["@user"];
    if (user && user.identity) {
      this._intervalId = setInterval(
        () => context.client.submitSessionHeartbeat(user.identity),
        this._interval,
      );
    }

    return Promise.resolve();
  }
}
