import { ModuleInfo } from "../../models/data/error/ModuleInfo.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ModuleInfoPlugin implements IEventPlugin {
  public priority: number = 50;
  public name: string = "ModuleInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const ERROR_KEY: string = "@error"; // optimization for minifier.

    const collector = context.client.config.moduleCollector;
    if (
      context.event.data[ERROR_KEY] && !context.event.data["@error"].modules &&
      collector
    ) {
      const modules: ModuleInfo[] = collector.getModules();
      if (modules && modules.length > 0) {
        context.event.data[ERROR_KEY].modules = modules;
      }
    }

    return Promise.resolve();
  }
}
