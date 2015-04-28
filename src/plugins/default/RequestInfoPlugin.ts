import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IRequestInfo } from '../../models/IRequestInfo';
import { Utils } from '../../Utils';

export class RequestInfoPlugin implements IEventPlugin {
  public priority:number = 60;
  public name:string = 'RequestInfoPlugin';

  run(context:EventPluginContext):Promise<any> {
    if (!!context.event.data && !!context.event.data['@request']) {
      return Promise.resolve();
    }

    if (!context.event.data) {
      context.event.data = {};
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

    context.event.data['@request'] = requestInfo;
    return Promise.resolve();
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
