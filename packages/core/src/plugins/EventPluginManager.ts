import { Configuration } from '../configuration/Configuration.js';
import { ConfigurationDefaultsPlugin } from './default/ConfigurationDefaultsPlugin.js';
import { DuplicateCheckerPlugin } from './default/DuplicateCheckerPlugin.js';
import { EnvironmentInfoPlugin } from './default/EnvironmentInfoPlugin.js';
import { ErrorPlugin } from './default/ErrorPlugin.js';
import { EventExclusionPlugin } from './default/EventExclusionPlugin.js';
import { ModuleInfoPlugin } from './default/ModuleInfoPlugin.js';
import { RequestInfoPlugin } from './default/RequestInfoPlugin.js';
import { SubmissionMethodPlugin } from './default/SubmissionMethodPlugin.js';
import { EventPluginContext } from './EventPluginContext.js';

export class EventPluginManager {
  public static async run(context: EventPluginContext): Promise<void> {
    for (const plugin of context.client.config.plugins) {
      if (context.cancelled) {
        break;
      }

      try {
        await plugin.run(context);
      } catch (ex) {
        context.cancelled = true;
        context.log.error(`Error running plugin '${plugin.name}': ${ex.message}. Discarding Event.`);
      }
    }
  }

  public static addDefaultPlugins(config: Configuration): void {
    config.addPlugin(new ConfigurationDefaultsPlugin());
    config.addPlugin(new ErrorPlugin());
    config.addPlugin(new DuplicateCheckerPlugin());
    config.addPlugin(new EventExclusionPlugin());
    config.addPlugin(new ModuleInfoPlugin());
    config.addPlugin(new RequestInfoPlugin());
    config.addPlugin(new EnvironmentInfoPlugin());
    config.addPlugin(new SubmissionMethodPlugin());
  }
}
