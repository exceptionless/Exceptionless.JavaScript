import { IModule } from '../models/IModule';
import { EventPluginContext } from '../plugins/EventPluginContext';

export interface IModuleCollector {
  getModules(context: EventPluginContext): IModule[];
}
