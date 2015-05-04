import { IRequestInfo } from '../models/IRequestInfo';
import { IRequestInfoCollector } from 'IRequestInfoCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  getRequestInfo(context:EventPluginContext):IRequestInfo {
    return undefined;
  }
}
