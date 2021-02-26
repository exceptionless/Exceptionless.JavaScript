import { EnvironmentInfo } from "../../models/data/EnvironmentInfo.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority: number = 80;
  public name: string = "EnvironmentInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const ENVIRONMENT_KEY: string = "@environment"; // optimization for minifier.

    const collector = context.client.config.environmentInfoCollector;
    if (!context.event.data[ENVIRONMENT_KEY] && collector) {
      const environmentInfo: EnvironmentInfo = collector.getEnvironmentInfo(
        context,
      );
      if (environmentInfo) {
        context.event.data[ENVIRONMENT_KEY] = environmentInfo;
      }
    }

    return Promise.resolve();
  }
}
