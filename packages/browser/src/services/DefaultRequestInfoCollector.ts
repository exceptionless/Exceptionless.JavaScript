import { IRequestInfo } from '../../../core/src/models/IRequestInfo';
import { EventPluginContext } from '../../../core/src/plugins/EventPluginContext';
import { Utils } from '../../../core/src/Utils';
import { IRequestInfoCollector } from '../../../core/src/services/IRequestInfoCollector';

export class DefaultRequestInfoCollector implements IRequestInfoCollector {
  public getRequestInfo(context: EventPluginContext): IRequestInfo {
    if (!document || !navigator || !location) {
      return null;
    }

    const config = context.client.config;
    const exclusions = config.dataExclusions;
    const requestInfo: IRequestInfo = {
      user_agent: navigator.userAgent,
      is_secure: location.protocol === 'https:',
      host: location.hostname,
      port: location.port && location.port !== '' ? parseInt(location.port, 10) : 80,
      path: location.pathname
      // client_ip_address: 'TODO'
    };

    if (config.includeCookies) {
      requestInfo.cookies = Utils.getCookies(document.cookie, exclusions);
    }

    if (config.includeQueryString) {
      requestInfo.query_string = Utils.parseQueryString(location.search.substring(1), exclusions);
    }

    if (document.referrer && document.referrer !== '') {
      requestInfo.referrer = document.referrer;
    }

    return requestInfo;
  }
}
