import {
  EventPluginContext,
  getCookies,
  IEventPlugin,
  isMatch,
  KnownEventDataKeys,
  parseQueryString,
  RequestInfo,
} from "@exceptionless/core";

export class BrowserRequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = "BrowserRequestInfoPlugin";

  public run(context: EventPluginContext): Promise<void> {
    if (context.event.data && !context.event.data[KnownEventDataKeys.RequestInfo]) {
      const requestInfo: RequestInfo | undefined = this.getRequestInfo(context);
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

  private getRequestInfo(context: EventPluginContext): RequestInfo | undefined {
    if (typeof document !== "object" || typeof navigator !== "object" || typeof location !== "object") {
      return;
    }

    const config = context.client.config;
    const exclusions = config.dataExclusions;
    const requestInfo: RequestInfo = {
      user_agent: navigator.userAgent,
      is_secure: location.protocol === "https:",
      host: location.hostname,
      port: location.port && location.port !== ""
        ? parseInt(location.port, 10)
        : 80,
      path: location.pathname,
      // client_ip_address: "TODO"
    };

    if (config.includeCookies) {
      requestInfo.cookies = getCookies(document.cookie, exclusions) as Record<string, string>;
    }

    if (config.includeQueryString) {
      requestInfo.query_string = parseQueryString(
        location.search.substring(1),
        exclusions,
      );
    }

    if (document.referrer && document.referrer !== "") {
      requestInfo.referrer = document.referrer;
    }

    return requestInfo;
  }
}
