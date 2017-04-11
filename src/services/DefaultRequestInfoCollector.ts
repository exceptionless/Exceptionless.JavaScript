import { IRequestInfo } from '../models/IRequestInfo';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Utils } from '../Utils';
import { IRequestInfoCollector } from './IRequestInfoCollector';

export class DefaultRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context: EventPluginContext): IRequestInfo {
    if (!document || !navigator || !location) {
      return null;
    }

    const exclusions = context.client.config.dataExclusions;
    const requestInfo: IRequestInfo = {
      user_agent: navigator.userAgent,
      is_secure: location.protocol === 'https:',
      host: location.hostname,
      port: location.port && location.port !== '' ? parseInt(location.port, 10) : 80,
      path: location.pathname,
      // client_ip_address: 'TODO',
      cookies: Utils.getCookies(document.cookie, exclusions),
      query_string: Utils.parseQueryString(location.search.substring(1), exclusions)
    };

    if (document.referrer && document.referrer !== '') {
      requestInfo.referrer = document.referrer;
    }

    return requestInfo;
  }
}
