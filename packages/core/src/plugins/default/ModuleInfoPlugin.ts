import { ModuleInfo } from "../../models/data/ModuleInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ModuleInfoPlugin implements IEventPlugin {
  public priority: number = 50;
  public name: string = "ModuleInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const collector = context.client.config.moduleCollector;
    // PERF: Ensure module info is cached and rework below statement.
    if (context.event.data[KnownEventDataKeys.Error] && !context.event.data[KnownEventDataKeys.Error]?.modules && collector) {
      const modules: ModuleInfo[] = collector.getModules();
      if (modules && modules.length > 0) {
        context.event.data[KnownEventDataKeys.Error].modules = modules;
      }
    }

    return Promise.resolve();
  }
}
