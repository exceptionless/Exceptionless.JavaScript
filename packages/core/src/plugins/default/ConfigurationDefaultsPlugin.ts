import { stringify, isEmpty } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority: number = 10;
  public name: string = "ConfigurationDefaultsPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const config = context.client.config;
    context.event.tags.push(...config.defaultTags);

    // PERF: Discus if we can calculate this a head of time and cache it.
    const defaultData: Record<string, unknown> = config.defaultData || {};
    for (const key in defaultData) {
      if (context.event.data[key] === undefined) {
        const result = JSON.parse(stringify(defaultData[key], config.dataExclusions));
        if (!isEmpty(result)) {
          context.event.data[key] = result;
        }
      }
    }

    return Promise.resolve();
  }
}
