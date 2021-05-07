import {
  EventPluginContext,
  getCookies,
  IRequestInfoCollector,
  RequestInfo,
  stringify,
} from "@exceptionless/core";

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context: EventPluginContext): RequestInfo {
    // TODO: Move this into a known keys.
    const REQUEST_KEY: string = "@request"; // optimization for minifier.
    if (!context.contextData[REQUEST_KEY]) {
      return null;
    }

    const config = context.client.config;
    const exclusions = config.dataExclusions;

    const request = context.contextData[REQUEST_KEY];
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
