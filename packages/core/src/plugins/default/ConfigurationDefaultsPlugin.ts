import { isEmpty } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority = 10;
  public name = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const config = context.client.config;
    const ev = context.event;

    if (config.defaultTags) {
      ev.tags = [...ev.tags || [], ...config.defaultTags];
    }

    const defaultData: Record<string, unknown> = config.defaultData || {};
    if (defaultData) {
      if (!ev.data) {
        ev.data = {};
      }

      for (const key in config.defaultData || {}) {
        if (ev.data[key] === undefined && !isEmpty(defaultData[key])) {
          ev.data[key] = defaultData[key];
        }
      }
    }

    return Promise.resolve();
  }
}
