import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IModule } from '../../models/IModule';
import { Utils } from '../../Utils';

export class ModuleInfoPlugin implements IEventPlugin {
  public priority:number = 40;
  public name:string = 'ModuleInfoPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    var moduleCollector = context.client.config.moduleCollector;
    if (context.event.data['@error'] && !context.event.data['@error'].modules && !!moduleCollector) {
      var modules = moduleCollector.getModules(context);
      if (modules && modules.length > 0) {
        context.event.data['@error'].modules = modules;
      }
    }

    if (next) {
      next();
    }
  }
}
