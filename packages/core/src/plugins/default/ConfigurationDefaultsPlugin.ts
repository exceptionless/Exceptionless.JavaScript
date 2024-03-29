import { isEmpty, stringify } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority = 10;
  public name = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const { dataExclusions, defaultData, defaultTags } = context.client.config;
    const ev = context.event;

    if (defaultTags) {
      ev.tags = [...(ev.tags || []), ...defaultTags];
    }

    if (defaultData) {
      if (!ev.data) {
        ev.data = {};
      }

      for (const key in defaultData) {
        if (ev.data[key] !== undefined || isEmpty(defaultData[key])) {
          continue;
        }

        const data = stringify(defaultData[key], dataExclusions);
        if (!isEmpty(data)) {
          ev.data[key] = JSON.parse(data);
        }
      }
    }

    return Promise.resolve();
  }
}
