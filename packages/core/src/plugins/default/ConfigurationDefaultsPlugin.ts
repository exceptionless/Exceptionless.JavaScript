import { isEmpty, normalizeEnvironment, stringify } from "../../Utils.js";
import { EventPluginContext } from "../../plugins/EventPluginContext.js";
import { IEventPlugin } from "../../plugins/IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority = 10;
  public name = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const { dataExclusions, defaultData, defaultTags } = context.client.config;
    const ev = context.event;
    const environment = normalizeEnvironment(ev.environment ?? context.client.config.environment);
    if (environment) {
      ev.environment = environment;
    } else {
      delete ev.environment;
    }

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
