import { stringify, isEmpty } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority: number = 10;
  public name: string = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const config = context.client.config;
    const defaultTags: string[] = config.defaultTags || [];
    for (const tag of defaultTags) {
      if (tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag);
      }
    }

    const defaultData: Record<string, unknown> = config.defaultData || {};
    for (const key in defaultData) {
      if (defaultData[key]) {
        const result = JSON.parse(stringify(defaultData[key], config.dataExclusions));
        if (!isEmpty(result)) {
          context.event.data[key] = result;
        }
      }
    }

    return Promise.resolve();
  }
}
