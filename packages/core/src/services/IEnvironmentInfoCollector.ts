import { IEnvironmentInfo } from '../models/IEnvironmentInfo.js';
import { EventPluginContext } from '../plugins/EventPluginContext.js';

export interface IEnvironmentInfoCollector {
  getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo;
}
