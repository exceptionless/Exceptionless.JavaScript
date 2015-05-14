import { Configuration } from '../configuration/Configuration';
import { IEventPlugin } from './IEventPlugin';
import { EventPluginContext } from './EventPluginContext';
import { ConfigurationDefaultsPlugin } from './default/ConfigurationDefaultsPlugin';
import { ErrorPlugin } from './default/ErrorPlugin';
import { DuplicateCheckerPlugin } from './default/DuplicateCheckerPlugin';
import { ModuleInfoPlugin } from './default/ModuleInfoPlugin';
import { RequestInfoPlugin } from './default/RequestInfoPlugin';
import { EnvironmentInfoPlugin } from './default/EnvironmentInfoPlugin';
import { SubmissionMethodPlugin } from './default/SubmissionMethodPlugin';

export class EventPluginManager {
  public static run(context:EventPluginContext, callback:() => void): void {
    var wrap = function (plugin:IEventPlugin, next?:() => void): () => void {
      return function () {
        try {
          plugin.run(context, next);
        } catch (ex) {
          context.log.error(`Error while running plugin '${plugin.name}': ${ex.message}. This event will be discarded.`);

        }
      };
    };

    var plugins:any[] = context.client.config.plugins.concat({ name: 'callback', priority: 9007199254740992, run: callback });
    for (var index = plugins.length - 1; index > -1; index--) {
      plugins[index] = wrap(plugins[index], index < plugins.length - 1 ? plugins[index + 1] : null);
    }

    plugins[0]();
  }

  public static addDefaultPlugins(config:Configuration): void {
    config.addPlugin(new ConfigurationDefaultsPlugin());
    config.addPlugin(new ErrorPlugin());
    config.addPlugin(new DuplicateCheckerPlugin());
    config.addPlugin(new ModuleInfoPlugin());
    config.addPlugin(new RequestInfoPlugin());
    config.addPlugin(new EnvironmentInfoPlugin());
    config.addPlugin(new SubmissionMethodPlugin());
  }
}
