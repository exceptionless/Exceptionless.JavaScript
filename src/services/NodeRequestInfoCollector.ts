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
      user_agent: request.headers['user-agent'],
      is_secure: request.secure,
      http_method: request.method,
      host: request.hostname || request.host,
      //port: TODO,
      path: request.path,
      post_data: request.body,
      //referrer: TODO,
      cookies: this.getCookies(request),
      query_string: request.params
    };

    return ri;
  }

  private getCookies(request): any {
    if (!request) {
      return null;
    }

    if (request.cookies) {
      return request.cookies;
    }

    var result = {};
    var cookies = (request.headers['cookie'] || '').split('; ');
    for (var index = 0; index < cookies.length; index++) {
      var cookie = cookies[index].split('=');
      result[cookie[0]] = cookie[1];
    }

    return result;
  }
}
