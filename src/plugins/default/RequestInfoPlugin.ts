import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IRequestInfo } from '../../models/IRequestInfo';

export class RequestInfoPlugin implements IEventPlugin {
  public priority:number = 60;
  public name:string = 'RequestInfoPlugin';

  run(context:EventPluginContext):Promise<any> {
    if (!!context.event.data && !!context.event.data['@request'] || !context.client.config.requestInfoCollector) {
      return Promise.resolve();
    }

    if (!context.event.data) {
      context.event.data = {};
    }

    var ri = context.client.config.requestInfoCollector.getRequestInfo(context);
    if (ri) {
      context.event.data['@request'] = ri;
    }

    return Promise.resolve();
  }
}
