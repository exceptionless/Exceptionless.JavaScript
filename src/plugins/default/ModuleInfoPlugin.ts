/// <reference path="../../references.ts" />

module Exceptionless {
  export class ModuleInfoPlugin implements IEventPlugin {
    public priority:number = 40;
    public name:string = 'ModuleInfoPlugin';

    run(context:Exceptionless.EventPluginContext):Promise<any> {
      console.log(context);
      if (!context.event.data || !context.event.data['@error'] || !!context.event.data['@error'].modules) {
        return Promise.resolve();
      }

      try {
        var modules:IModule[] = [];
        var scripts = document.getElementsByTagName('script');
        if (scripts && scripts.length > 0) {
          for (var index = 0; index < scripts.length; index++) {
            if (scripts[index].src) {
              modules.push({ module_id: index, name: scripts[index].src, version: Utils.parseVersion(scripts[index].src) });
            } else if (!!scripts[index].innerHTML) {
              modules.push({ module_id: index, name: 'Script Tag', version: Utils.getHashCode(scripts[index].innerHTML) });
            }
          }

          context.event.data['@error'].modules = modules;
        }
      } catch (e) {
        context.log.error('Unable to get module info. Exception: ' + e.message);
      }

      return Promise.resolve();
    }
  }
}
