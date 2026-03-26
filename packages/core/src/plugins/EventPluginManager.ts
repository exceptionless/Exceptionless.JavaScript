import { Configuration } from "../configuration/Configuration.js";
import { ConfigurationDefaultsPlugin } from "../plugins/default/ConfigurationDefaultsPlugin.js";
import { DuplicateCheckerPlugin } from "../plugins/default/DuplicateCheckerPlugin.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";
import { EventExclusionPlugin } from "../plugins/default/EventExclusionPlugin.js";
import { PluginContext } from "../plugins/PluginContext.js";
import { ReferenceIdPlugin } from "../plugins/default/ReferenceIdPlugin.js";
import { SimpleErrorPlugin } from "../plugins/default/SimpleErrorPlugin.js";
import { SubmissionMethodPlugin } from "../plugins/default/SubmissionMethodPlugin.js";

export class EventPluginManager {
  public static async startup(context: PluginContext): Promise<void> {
    for (const plugin of context.client.config.plugins) {
      if (!plugin.startup) {
        continue;
      }

      try {
        await plugin.startup(context);
      } catch (ex) {
        context.log.error(`Error running plugin startup"${<string>plugin.name}": ${ex instanceof Error ? ex.message : ex + ""}`);
      }
    }
  }

  public static async suspend(context: PluginContext): Promise<void> {
    for (const plugin of context.client.config.plugins) {
      if (!plugin.suspend) {
        continue;
      }

      try {
        await plugin.suspend(context);
      } catch (ex) {
        context.log.error(`Error running plugin suspend"${<string>plugin.name}": ${ex instanceof Error ? ex.message : ex + ""}`);
      }
    }
  }

  public static async run(context: EventPluginContext): Promise<void> {
    for (const plugin of context.client.config.plugins) {
      if (context.cancelled) {
        break;
      }

      if (!plugin.run) {
        continue;
      }

      try {
        await plugin.run(context);
      } catch (ex) {
        context.cancelled = true;
        context.log.error(`Error running plugin "${<string>plugin.name}": ${ex instanceof Error ? ex.message : ex + ""}. Discarding Event.`);
      }
    }
  }

  public static addDefaultPlugins(config: Configuration): void {
    config.addPlugin(new ConfigurationDefaultsPlugin());
    config.addPlugin(new SimpleErrorPlugin());
    config.addPlugin(new ReferenceIdPlugin());
    config.addPlugin(new DuplicateCheckerPlugin());
    config.addPlugin(new EventExclusionPlugin());
    config.addPlugin(new SubmissionMethodPlugin());
  }
}
