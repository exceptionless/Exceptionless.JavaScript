import { IRequestInfo } from '../../models/IRequestInfo.js';
import { isMatch } from "../../Utils.js";
import { EventPluginContext } from '../EventPluginContext.js';
import { IEventPlugin } from '../IEventPlugin.js';

export class RequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = 'RequestInfoPlugin';

  public run(context: EventPluginContext): Promise<void> {
    const REQUEST_KEY: string = '@request'; // optimization for minifier.

    const config = context.client.config;
    const collector = config.requestInfoCollector;
    if (!context.event.data[REQUEST_KEY] && collector) {
      const requestInfo: IRequestInfo = collector.getRequestInfo(context);
      if (requestInfo) {
        if (isMatch(requestInfo.user_agent, config.userAgentBotPatterns)) {
          context.log.info('Cancelling event as the request user agent matches a known bot pattern');
          context.cancelled = true;
        } else {
          context.event.data[REQUEST_KEY] = requestInfo;
        }
      }
    }

    return Promise.resolve();
  }
}
