import { EnvironmentInfo } from "../models/data/EnvironmentInfo.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";

export interface IEnvironmentInfoCollector {
  getEnvironmentInfo(context: EventPluginContext): EnvironmentInfo;
}
