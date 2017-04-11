import { IRequestInfo } from '../models/IRequestInfo';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';
import { IRequestInfoCollector } from './IRequestInfoCollector';

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context: EventPluginContext): IRequestInfo {
    const REQUEST_KEY: string = '@request'; // optimization for minifier.
    if (!context.contextData[REQUEST_KEY]) {
      return null;
    }

    const exclusions = context.client.config.dataExclusions;

    // TODO: include referrer
    const request = context.contextData[REQUEST_KEY];
    const requestInfo: IRequestInfo = {
      client_ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      is_secure: request.secure,
      http_method: request.method,
      host: request.hostname || request.host,
      path: request.path,
      post_data: JSON.parse(Utils.stringify(request.body || {}, exclusions)),
      cookies: Utils.getCookies(request.headers.cookie, exclusions),
      query_string: JSON.parse(Utils.stringify(request.params || {}, exclusions))
    };

    const host = request.headers.host;
    const port: number = host && parseInt(host.slice(host.indexOf(':') + 1), 10);
    if (port > 0) {
      requestInfo.port = port;
    }

    return requestInfo;
  }
}
