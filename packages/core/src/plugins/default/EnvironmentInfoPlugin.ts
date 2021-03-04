import { EnvironmentInfo } from "../../models/data/EnvironmentInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority: number = 80;
  public name: string = "EnvironmentInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    // TODO: Discus if we can get rid of collectors and just add them per integration.
    const collector = context.client.config.environmentInfoCollector;
    if (!context.event.data[KnownEventDataKeys.EnvironmentInfo] && collector) {
      const environmentInfo: EnvironmentInfo = collector.getEnvironmentInfo(context);
      if (environmentInfo) {
        context.event.data[KnownEventDataKeys.EnvironmentInfo] = environmentInfo;
      }
    }

    return Promise.resolve();
  }
}
