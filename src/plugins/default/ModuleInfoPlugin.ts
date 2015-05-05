import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IModule } from '../../models/IModule';
import { Utils } from '../../Utils';

export class ModuleInfoPlugin implements IEventPlugin {
  public priority:number = 40;
  public name:string = 'ModuleInfoPlugin';

  run(context:EventPluginContext):Promise<any> {
    if (!context.event.data ||
        !context.event.data['@error'] ||
        !!context.event.data['@error'].modules ||
        !context.client.config.moduleCollector) {
      return Promise.resolve();
    }

    var modules = context.client.config.moduleCollector.getModules(context);
    if (modules && modules.length > 0) {
      context.event.data['@error'].modules = modules;
    }

    return Promise.resolve();
  }
}
