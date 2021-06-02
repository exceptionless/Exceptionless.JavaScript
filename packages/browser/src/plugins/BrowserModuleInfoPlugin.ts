import {
  EventPluginContext,
  getHashCode,
  IEventPlugin,
  KnownEventDataKeys,
  ModuleInfo,
  parseVersion,
  PluginContext
} from "@exceptionless/core";

export class BrowserModuleInfoPlugin implements IEventPlugin {
  public priority: number = 50;
  public name: string = "BrowserModuleInfoPlugin";
  private _modules: ModuleInfo[] | undefined;

  public startup(context: PluginContext): Promise<void> {
    if (!this._modules) {
      this._modules = this.getModules();
    }

    return Promise.resolve();
  }

  public run(context: EventPluginContext): Promise<void> {
    const error = context.event.data?.[KnownEventDataKeys.Error];
    if (error && !error?.modules && this._modules?.length) {
      error.modules = this._modules;
    }

    return Promise.resolve();
  }

  private getModules(): ModuleInfo[] | undefined {
    if (!document || !document.getElementsByTagName) {
      return;
    }

    const modules: ModuleInfo[] = [];
    const scripts: HTMLCollectionOf<HTMLScriptElement> = document
      .getElementsByTagName("script");
    if (scripts && scripts.length > 0) {
      for (let index = 0; index < scripts.length; index++) {
        if (scripts[index].src) {
          modules.push({
            module_id: index,
            name: scripts[index].src.split("?")[0],
            version: <string>parseVersion(scripts[index].src),
          });
        } else if (scripts[index].innerHTML) {
          modules.push({
            module_id: index,
            name: "Script Tag",
            version: getHashCode(scripts[index].innerHTML).toString(),
          });
        }
      }
    }

    return modules;
  }
}
