import { ModuleInfo } from "../models/data/error/ModuleInfo.js";

export interface IModuleCollector {
  getModules(): ModuleInfo[];
}
