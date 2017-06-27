import { IModule } from '../../models/IModule';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class ModuleInfoPlugin implements IEventPlugin {
  public priority: number = 50;
  public name: string = 'ModuleInfoPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const ERROR_KEY: string = '@error'; // optimization for minifier.

    const collector = context.client.config.moduleCollector;
    if (context.event.data[ERROR_KEY] && !context.event.data['@error'].modules && !!collector) {
      const modules: IModule[] = collector.getModules(context);
      if (modules && modules.length > 0) {
        context.event.data[ERROR_KEY].modules = modules;
      }
    }

    next && next();
  }
}
