import { ModuleInfo } from "../models/data/ModuleInfo.js";

export interface IModuleCollector {
  getModules(): ModuleInfo[];
}
