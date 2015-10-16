import { IModule } from '../models/IModule';
import { IModuleCollector } from './IModuleCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';

import child = require('child_process');
import path = require('path');

export class NodeModuleCollector implements IModuleCollector {

  private initialized:boolean = false;
  private installedModules:{[id:string]: IModule} = {};

  public getModules(context:EventPluginContext): IModule[] {
    this.initialize();

    if (!require.main) return [];

    var modulePath = path.dirname(require.main.filename) + '/node_modules/';
    var pathLength = modulePath.length;

    var loadedKeys = Object.keys(require.cache);
    var loadedModules = {};

    loadedKeys.forEach(key => {
      var id = key.substr(pathLength);
      console.log(id);
      id = id.substr(0, id.indexOf('/'));
      loadedModules[id] = true;
    });

    return Object.keys(loadedModules)
      .map(key => this.installedModules[key])
      .filter(m => m !== undefined);
  }

  private initialize() {
    if (this.initialized) return;
    this.initialized = true;

    var output = child.spawnSync('npm', ['ls', '--depth=0', '--json']).stdout;

    if (!output) return;

    var json;
    try {
     json = JSON.parse(output.toString());
    }
    catch (e) { return; }

    var items = json.dependencies;
    if (!items) return;

    var id = 0;
    this.installedModules = {};

    Object.keys(items).forEach(key => {
      var item = items[key];
      var theModule = <IModule> {
        module_id: id++,
        name: key,
        version: item.version
      };

      this.installedModules[key] = theModule;
    });
  }
}
