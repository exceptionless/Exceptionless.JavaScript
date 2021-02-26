import { spawnSync } from "child_process";

import { dirname, join, resolve } from "path";

import { argv } from "process";

import { IModuleCollector, ModuleInfo } from "@exceptionless/core";

export class NodeModuleCollector implements IModuleCollector {
  private initialized: boolean = false;
  private installedModules: { [id: string]: ModuleInfo } = {};

  public getModules(): ModuleInfo[] {
    if (argv && argv.length < 2) {
      return [];
    }

    this.initialize();

    // TODO: Cache this lookup
    const modulePath = resolve(join(dirname(argv[1]), "node_modules"));
    // TODO: What to do if this doesn"t exist..
    console.log(modulePath);
    const pathLength = modulePath.length;

    // TODO: Figure out how to remove require
    const loadedKeys: string[] = Object.keys(require.cache);
    const loadedModules: { [id: string]: boolean } = {};

    loadedKeys.forEach((key) => {
      let id = key.substr(pathLength);
      id = id.substr(0, id.indexOf("/"));
      loadedModules[id] = true;
    });
    console.log(loadedKeys, loadedModules, module);
    return Object.keys(loadedModules)
      .map((key) => this.installedModules[key])
      .filter((m) => m !== undefined);
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    let json: { dependencies?: { version: string }[] };
    try {
      const output = spawnSync("npm", ["ls", "--depth=0", "--json"]).stdout;
      if (!output) {
        return;
      }

      json = JSON.parse(output.toString());
    } catch (e) {
      return;
    }

    const items = json.dependencies;
    if (!items) {
      return;
    }

    let id = 0;
    this.installedModules = {};

    Object.keys(items).forEach((key) => {
      const item = items[key];
      const theModule: ModuleInfo = {
        module_id: id++,
        name: key,
        version: item.version,
      };

      this.installedModules[key] = theModule;
    });
  }
}
