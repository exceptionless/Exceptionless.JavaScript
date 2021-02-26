import {
  EventPluginContext,
  getCookies,
  IRequestInfoCollector,
  parseQueryString,
  RequestInfo,
} from "@exceptionless/core";

export class DefaultRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context: EventPluginContext): RequestInfo {
    if (!document || !navigator || !location) {
      return null;
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
      // client_ip_address: 'TODO'
    };

    if (config.includeCookies) {
      requestInfo.cookies = getCookies(document.cookie, exclusions);
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
