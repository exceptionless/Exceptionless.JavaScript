import { IEnvironmentInfo } from '../models/IEnvironmentInfo';
import { EventPluginContext } from '../plugins/EventPluginContext';

export interface IEnvironmentInfoCollector {
  getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo;
}
