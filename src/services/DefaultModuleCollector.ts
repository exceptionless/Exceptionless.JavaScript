import { IModule } from '../models/IModule';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';
import { IModuleCollector } from './IModuleCollector';

export class DefaultModuleCollector implements IModuleCollector {
  public getModules(context: EventPluginContext): IModule[] {
    if (!document || !document.getElementsByTagName) {
      return null;
    }

    const modules: IModule[] = [];
    const scripts: NodeListOf<HTMLScriptElement> = document.getElementsByTagName('script');
    if (scripts && scripts.length > 0) {
      for (let index = 0; index < scripts.length; index++) {
        if (scripts[index].src) {
          modules.push({
            module_id: index,
            name: scripts[index].src.split('?')[0],
            version: Utils.parseVersion(scripts[index].src)
          });
        } else if (!!scripts[index].innerHTML) {
          modules.push({
            module_id: index,
            name: 'Script Tag',
            version: Utils.getHashCode(scripts[index].innerHTML).toString()
          });
        }
      }
    }

    return modules;
  }
}
