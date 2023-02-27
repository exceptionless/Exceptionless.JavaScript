import { guid } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class SessionIdManagementPlugin implements IEventPlugin {
  public priority = 25;
  public name = "SessionIdManagementPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const ev = context.event;
    const isSessionStart: boolean = ev.type === "session";
    const { config } = context.client;
    if (isSessionStart || !config.currentSessionIdentifier) {
      config.currentSessionIdentifier = guid().replaceAll("-", "");
    }

    if (isSessionStart) {
      ev.reference_id = config.currentSessionIdentifier;
    } else {
      if (!ev.data) {
        ev.data = {};
      }

      ev.data["@ref:session"] = config.currentSessionIdentifier;
    }

    return Promise.resolve();
  }
}
