import { IRequestInfo } from '../models/IRequestInfo';
import { EventPluginContext } from '../plugins/EventPluginContext';

export interface IRequestInfoCollector {
  getRequestInfo(context: EventPluginContext): IRequestInfo;
}
