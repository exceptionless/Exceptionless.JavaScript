import { IModule } from '../models/IModule.js';

export interface IModuleCollector {
  getModules(): IModule[];
}
