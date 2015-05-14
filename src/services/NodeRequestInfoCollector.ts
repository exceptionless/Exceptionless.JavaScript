import { IRequestInfo } from '../models/IRequestInfo';
import { IRequestInfoCollector } from 'IRequestInfoCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  getRequestInfo(context:EventPluginContext):IRequestInfo {
    if (!context.contextData['@request']) {
      return null;
    }

    var request = context.contextData['@request'];
    var ri:IRequestInfo = {
      client_ip_address: request.ip,
      user_agent: request.headers['user-agent'],
      is_secure: request.secure,
      http_method: request.method,
      host: request.hostname || request.host,
      //port: TODO,
      path: request.path,
      post_data: request.body,
      //referrer: TODO,
      cookies: Utils.getCookies((request || {}).headers['cookie'], '; '),
      query_string: request.params
    };

    return ri;
  }
}
