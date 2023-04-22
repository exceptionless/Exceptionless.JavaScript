import {
  EventPluginContext,
  getCookies,
  IEventPlugin,
  isEmpty,
  isMatch,
  KnownEventDataKeys,
  RequestInfo,
  stringify,
} from "@exceptionless/core";

export class NodeRequestInfoPlugin implements IEventPlugin {
  public priority: number = 70;
  public name: string = "NodeRequestInfoPlugin";

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
    // TODO: Move this into a known keys.
    const REQUEST_KEY: string = "@request";
    if (!context.eventContext[REQUEST_KEY]) {
      return;
    }

    const config = context.client.config;
    const exclusions = config.dataExclusions;

    type requestShape = {
      method: string,
      secure: boolean,
      ip: string,
      hostname: string,
      path: string,
      headers: Record<string, string>,
      params: Record<string, unknown>,
      body?: object
    };

    const request = context.eventContext[REQUEST_KEY] as requestShape;
    const requestInfo: RequestInfo = {
      user_agent: request.headers["user-agent"],
      http_method: request.method,
      is_secure: request.secure,
      host: request.hostname,
      path: request.path,
      referrer: request.headers.referer
    };

    const host = request.headers.host;
    const port: number = host && parseInt(host.slice(host.indexOf(":") + 1), 10) || 0;
    if (port > 0) {
      requestInfo.port = port;
    }

    if (config.includeIpAddress) {
      requestInfo.client_ip_address = request.ip;
    }

    if (config.includeCookies) {
      requestInfo.cookies = getCookies(request.headers.cookie, exclusions) as Record<string, string>;
    }

    if (config.includeHeaders) {
      const ignoredHeaders = [
        "Authorization",
        "Cookie",
        "Host",
        "Method",
        "Path",
        "Proxy-Authorization",
        "Referer",
        "User-Agent"
      ];

      const json = stringify(request.headers, [...ignoredHeaders, ...exclusions]);
      if (!isEmpty(json)) {
        const headers: Record<string, string[]> = {};
        const parsedHeaders = JSON.parse(json) as Record<string, string>;
        for (const key in parsedHeaders) {
          headers[key] = parsedHeaders[key].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(value => value.trim());
        }

        requestInfo.headers = headers;
      }
    }

    if (config.includeQueryString) {
      const json = stringify(request.params, exclusions);
      if (!isEmpty(json)) {
        requestInfo.query_string = JSON.parse(json) as Record<string, string>;
      }
    }

    if (config.includePostData) {
      const json = stringify(request.body, exclusions);
      if (!isEmpty(json)) {
        requestInfo.post_data = JSON.parse(json) as Record<string, unknown>;
      }
    }

    return requestInfo;
  }
}
