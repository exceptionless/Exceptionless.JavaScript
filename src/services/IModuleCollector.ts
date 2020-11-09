import { IModule } from '../models/IModule';

export interface IModuleCollector {
  getModules(): IModule[];
}
