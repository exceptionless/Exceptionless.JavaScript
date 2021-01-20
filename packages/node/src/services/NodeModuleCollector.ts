import { IModule } from '@exceptionless/core/models/IModule';
import { IModuleCollector } from '@exceptionless/core/services/IModuleCollector';

import child = require('child_process');
import path = require('path');

export class NodeModuleCollector implements IModuleCollector {

  private initialized: boolean = false;
  private installedModules: { [id: string]: IModule } = {};

  public getModules(): IModule[] {
    if (!require.main || !require.main.filename) {
      return [];
    }

    this.initialize();

    const modulePath = path.dirname(require.main.filename) + '/node_modules/';
    const pathLength = modulePath.length;

    const loadedKeys = Object.keys(require.cache);
    const loadedModules = {};

    loadedKeys.forEach((key) => {
      let id = key.substr(pathLength);
      id = id.substr(0, id.indexOf('/'));
      loadedModules[id] = true;
    });

    return Object.keys(loadedModules)
      .map((key) => this.installedModules[key])
      .filter((m) => m !== undefined);
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    let json;
    try {
      const output = child.spawnSync('npm', ['ls', '--depth=0', '--json']).stdout;
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
      const theModule: IModule = {
        module_id: id++,
        name: key,
        version: item.version
      };

      this.installedModules[key] = theModule;
    });
  }
}
