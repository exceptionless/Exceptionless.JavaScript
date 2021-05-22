import { isEmpty } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority = 10;
  public name = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const config = context.client.config;
    context.event.tags.push(...config.defaultTags);

    const defaultData: Record<string, unknown> = config.defaultData || {};
    for (const key in config.defaultData || {}) {
      if (context.event.data[key] === undefined && !isEmpty(defaultData[key])) {
        context.event.data[key] = defaultData[key];
      }
    }

    return Promise.resolve();
  }
}
