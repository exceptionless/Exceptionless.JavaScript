import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IRequestInfo } from '../../models/IRequestInfo';

export class RequestInfoPlugin implements IEventPlugin {
  public priority:number = 60;
  public name:string = 'RequestInfoPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    const request:string = '@request'; // optimization for minifier.

    var collector = context.client.config.requestInfoCollector;
    if (!context.event.data[request] && !!collector) {
      var requestInfo = collector.getRequestInfo(context);
      if (!!requestInfo) {
        context.event.data[request] = requestInfo;
      }
    }

    next && next();
  }
}
