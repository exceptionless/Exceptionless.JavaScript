import { IModule } from '../models/IModule';
import { IModuleCollector } from './IModuleCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';

import child = require('child_process');
import path = require('path');

export class NodeModuleCollector implements IModuleCollector {

  private initialized: boolean = false;
  private installedModules: { [id: string]: IModule } = {};

  public getModules(context: EventPluginContext): IModule[] {
    this.initialize();

    if (!require.main) {
      return [];
    }

    let modulePath = path.dirname(require.main.filename) + '/node_modules/';
    let pathLength = modulePath.length;

    let loadedKeys = Object.keys(require.cache);
    let loadedModules = {};

    loadedKeys.forEach(key => {
      let id = key.substr(pathLength);
      id = id.substr(0, id.indexOf('/'));
      loadedModules[id] = true;
    });

    return Object.keys(loadedModules)
      .map(key => this.installedModules[key])
      .filter(m => m !== undefined);
  }

  private initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;

    let output = child.spawnSync('npm', ['ls', '--depth=0', '--json']).stdout;

    if (!output) {
      return;
    }

    let json;
    try {
      json = JSON.parse(output.toString());
    } catch (e) {
      return;
    }

    let items = json.dependencies;
    if (!items) {
      return;
    }

    let id = 0;
    this.installedModules = {};

    Object.keys(items).forEach(key => {
      let item = items[key];
      let theModule = <IModule>{
        module_id: id++,
        name: key,
        version: item.version
      };

      this.installedModules[key] = theModule;
    });
  }
}
