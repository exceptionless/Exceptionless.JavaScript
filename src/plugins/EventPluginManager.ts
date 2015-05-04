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
  public static run(context:EventPluginContext): Promise<any> {
    return context.client.config.plugins.reduce((promise:Promise<any>, plugin:IEventPlugin) => {
      return promise.then(() => {
        return plugin.run(context);
      });
    }, Promise.resolve());
  }

  public static addDefaultPlugins(config:Configuration): void {
    config.addPlugin(new ConfigurationDefaultsPlugin());
    config.addPlugin(new ErrorPlugin());
    config.addPlugin(new DuplicateCheckerPlugin());
    config.addPlugin(new ModuleInfoPlugin());
    config.addPlugin(new RequestInfoPlugin());
    config.addPlugin(new EnvironmentInfoPlugin())
    config.addPlugin(new SubmissionMethodPlugin());
  }
}
