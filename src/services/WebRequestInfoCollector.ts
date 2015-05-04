import { IRequestInfo } from '../models/IRequestInfo';
import { IRequestInfoCollector } from 'IRequestInfoCollector';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';

export class WebRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context:EventPluginContext): IRequestInfo {
    if (!navigator || !location) {
      return null;
    }

    var requestInfo:IRequestInfo = {
      user_agent: navigator.userAgent,
      is_secure: location.protocol === 'https:',
      host: location.hostname,
      port: location.port && location.port !== '' ? parseInt(location.port) : 80,
      path: location.pathname,
      //client_ip_address: 'TODO',
      cookies: this.getCookies(),
      query_string: Utils.parseQueryString(location.search.substring(1))
    };

    if (document.referrer && document.referrer !== '') {
      requestInfo.referrer = document.referrer;
    }
  }

  private getCookies(): any {
    if (!document.cookie) {
      return null;
    }

    var result = {};

    var cookies = document.cookie.split(', ');
    for (var index = 0; index < cookies.length; index++) {
      var cookie = cookies[index].split('=');
      result[cookie[0]] = cookie[1];
    }

    return result;
  }
}
