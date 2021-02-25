import {
  IModule,
  IModuleCollector,
  getHashCode,
  parseVersion
} from '@exceptionless/core';

export class DefaultModuleCollector implements IModuleCollector {
  public getModules(): IModule[] {
    if (!document || !document.getElementsByTagName) {
      return null;
    }

    const modules: IModule[] = [];
    const scripts: HTMLCollectionOf<HTMLScriptElement> = document.getElementsByTagName('script');
    if (scripts && scripts.length > 0) {
      for (let index = 0; index < scripts.length; index++) {
        if (scripts[index].src) {
          modules.push({
            module_id: index,
            name: scripts[index].src.split('?')[0],
            version: parseVersion(scripts[index].src)
          });
        } else if (scripts[index].innerHTML) {
          modules.push({
            module_id: index,
            name: 'Script Tag',
            version: getHashCode(scripts[index].innerHTML).toString()
          });
        }
      }
    }

    return modules;
  }
}
