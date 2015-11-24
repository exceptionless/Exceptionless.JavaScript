import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IRequestInfo } from '../../models/IRequestInfo';

export class RequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = 'RequestInfoPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const REQUEST_KEY: string = '@request'; // optimization for minifier.

    let collector = context.client.config.requestInfoCollector;
    if (!context.event.data[REQUEST_KEY] && !!collector) {
      let requestInfo: IRequestInfo = collector.getRequestInfo(context);
      if (!!requestInfo) {
        context.event.data[REQUEST_KEY] = requestInfo;
      }
    }

    next && next();
  }
}
