import {
  EventPluginContext,
  getCookies,
  IEventPlugin,
  isMatch,
  KnownEventDataKeys,
  RequestInfo,
  stringify,
} from "@exceptionless/core";

export class NodeRequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = "NodeRequestInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    if (!context.event.data[KnownEventDataKeys.RequestInfo]) {
      const requestInfo: RequestInfo = this.getRequestInfo(context);
      if (requestInfo) {
        if (isMatch(requestInfo.user_agent, context.client.config.userAgentBotPatterns)) {
          context.log.info("Cancelling event as the request user agent matches a known bot pattern");
          context.cancelled = true;
        } else {
          context.event.data[KnownEventDataKeys.RequestInfo] = requestInfo;
        }
      }
    }

    return Promise.resolve();
  }

  private getRequestInfo(context: EventPluginContext): RequestInfo {
    // TODO: Move this into a known keys.
    const REQUEST_KEY: string = "@request";
    if (!context.eventContext[REQUEST_KEY]) {
      return null;
    }

    const config = context.client.config;
    const exclusions = config.dataExclusions;

    const request: any = context.eventContext[REQUEST_KEY];
    const requestInfo: RequestInfo = {
      user_agent: request.headers["user-agent"],
      http_method: request.method,
      is_secure: request.secure,
      host: request.hostname,
      path: request.path,
      referrer: request.headers.referer
    };

    const host = request.headers.host;
    const port: number = host &&
      parseInt(host.slice(host.indexOf(":") + 1), 10);
    if (port > 0) {
      requestInfo.port = port;
    }

    if (config.includeIpAddress) {
      requestInfo.client_ip_address = request.ip;
    }

    if (config.includeCookies) {
      requestInfo.cookies = getCookies(request.headers.cookie, exclusions);
    }

    if (config.includeQueryString) {
      requestInfo.query_string = JSON.parse(
        stringify(request.params || {}, exclusions),
      );
    }

    if (config.includePostData) {
      requestInfo.post_data = JSON.parse(
        stringify(request.body || {}, exclusions),
      );
    }

    return requestInfo;
  }
}
