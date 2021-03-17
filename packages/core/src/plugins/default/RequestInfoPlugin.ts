import { RequestInfo } from "../../models/data/RequestInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { isMatch } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class RequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = "RequestInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const config = context.client.config;
    const collector = config.services.requestInfoCollector;
    if (!context.event.data[KnownEventDataKeys.RequestInfo] && collector) {
      const requestInfo: RequestInfo = collector.getRequestInfo(context);
      if (requestInfo) {
        if (isMatch(requestInfo.user_agent, config.userAgentBotPatterns)) {
          context.log.info("Cancelling event as the request user agent matches a known bot pattern");
          context.cancelled = true;
        } else {
          context.event.data[KnownEventDataKeys.RequestInfo] = requestInfo;
        }
      }
    }

    return Promise.resolve();
  }
}
