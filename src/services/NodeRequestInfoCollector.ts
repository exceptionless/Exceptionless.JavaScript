import { IRequestInfo } from '../models/IRequestInfo';
import { IRequestInfoCollector } from 'IRequestInfoCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';

export class NodeRequestInfoCollector implements IRequestInfoCollector {
  getRequestInfo(context:EventPluginContext):IRequestInfo {
    if (!context.contextData['@request']) {
      return null;
    }

    var request = context.contextData['@request'];
    var ri:IRequestInfo = {
      client_ip_address: request.ip,
      //user_agent: TODO,
      is_secure: request.secure,
      //http_method: TODO,
      host: request.hostname,
      //port: TODO,
      path: request.path,
      post_data: request.body,
      //referrer: TODO,
      cookies: request.cookies,
      query_string: request.params
    };

    return ri;
  }
}
