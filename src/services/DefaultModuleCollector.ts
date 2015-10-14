import { IModule } from '../models/IModule';
import { IModuleCollector } from './IModuleCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';

export class DefaultModuleCollector implements IModuleCollector {
  public getModules(context:EventPluginContext): IModule[] {
    if (document && document.getElementsByTagName) {
      return null;
    }

    var modules:IModule[] = [];
    var scripts = document.getElementsByTagName('script');
    if (scripts && scripts.length > 0) {
      for (var index = 0; index < scripts.length; index++) {
        if (scripts[index].src) {
          modules.push({
            module_id: index,
            name: scripts[index].src,
            version: Utils.parseVersion(scripts[index].src)
          });
        } else if (!!scripts[index].innerHTML) {
          modules.push({
            module_id: index,
            name: 'Script Tag',
            version: Utils.getHashCode(scripts[index].innerHTML)
          });
        }
      }
    }

    return modules;
  }
}
