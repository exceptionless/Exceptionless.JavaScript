import { IRequestInfo } from '../models/IRequestInfo.js';
import { EventPluginContext } from '../plugins/EventPluginContext.js';

export interface IRequestInfoCollector {
  getRequestInfo(context: EventPluginContext): IRequestInfo;
}
