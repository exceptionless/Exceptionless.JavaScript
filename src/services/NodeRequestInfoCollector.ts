import { IRequestInfo } from '../models/IRequestInfo';
import { IRequestInfoCollector } from './IRequestInfoCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  getRequestInfo(context:EventPluginContext):IRequestInfo {
    const REQUEST_KEY:string = '@request'; // optimization for minifier.
    if (!context.contextData[REQUEST_KEY]) {
      return null;
    }

    let request = context.contextData[REQUEST_KEY];
    // TODO: include referrer
    let requestInfo:IRequestInfo = {
      client_ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      is_secure: request.secure,
      http_method: request.method,
      host: request.hostname || request.host,
      path: request.path,
      post_data: request.body,
      cookies: Utils.getCookies((request || {}).headers.cookie),
      query_string: request.params
    };

    let host = request.headers.host;
    let port:number = host && parseInt(host.slice(host.indexOf(':') + 1), 10);
    if (port > 0) {
      requestInfo.port = port;
    }

    return requestInfo;
  }
}
