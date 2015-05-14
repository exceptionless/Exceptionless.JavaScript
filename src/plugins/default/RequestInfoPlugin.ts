import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IRequestInfo } from '../../models/IRequestInfo';

export class RequestInfoPlugin implements IEventPlugin {
  public priority:number = 60;
  public name:string = 'RequestInfoPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    var requestInfoCollector = context.client.config.requestInfoCollector;
    if (!context.event.data['@request'] && !!requestInfoCollector) {
      var ri = requestInfoCollector.getRequestInfo(context);
      if (!!ri) {
        context.event.data['@request'] = ri;
      }
    }

    if (next) {
      next();
    }
  }
}
