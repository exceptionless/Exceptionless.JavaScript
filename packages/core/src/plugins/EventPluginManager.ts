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
import { IEventPlugin } from './IEventPlugin.js';

export class EventPluginManager {
  public static run(context: EventPluginContext, callback: (context?: EventPluginContext) => void): void {
    const wrap = (plugin: IEventPlugin, next?: () => void): () => void => {
      return () => {
        try {
          if (!context.cancelled) {
            plugin.run(context, next);
          }
        } catch (ex) {
          context.cancelled = true;
          context.log.error(`Error running plugin '${plugin.name}': ${ex.message}. Discarding Event.`);
        }

        if (context.cancelled && callback) {
          callback(context);
        }
      };
    };

    const plugins: IEventPlugin[] = context.client.config.plugins; // optimization for minifier.
    const wrappedPlugins: Array<() => void> = [];
    if (callback) {
      wrappedPlugins[plugins.length] = wrap({ name: 'cb', priority: 9007199254740992, run: callback }, null);
    }

    for (let index = plugins.length - 1; index > -1; index--) {
      wrappedPlugins[index] = wrap(plugins[index], callback || (index < plugins.length - 1) ? wrappedPlugins[index + 1] : null);
    }

    wrappedPlugins[0]();
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
