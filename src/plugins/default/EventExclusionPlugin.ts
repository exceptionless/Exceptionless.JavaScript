import { IInnerError } from '../../models/IInnerError';
import { Utils } from '../../Utils';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class EventExclusionPlugin implements IEventPlugin {
  public priority: number = 45;
  public name: string = 'EventExclusionPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    function getLogLevel(level: string): number {
      switch ((level || '').toLowerCase().trim()) {
        case 'trace':
        case 'true':
        case '1':
        case 'yes':
          return 0;
        case 'debug':
          return 1;
        case 'info':
          return 2;
        case 'warn':
          return 3;
        case 'error':
          return 4;
        case 'fatal':
          return 5;
        case 'off':
        case 'false':
        case '0':
        case 'no':
          return 6;
        default:
          return -1;
      }
    }

    function getMinLogLevel(settings: object, loggerName: string = '*'): number {
      return getLogLevel(getTypeAndSourceSetting(settings, 'log', loggerName, 'Trace') + '');
    }

    // tslint:disable-next-line:ban-types
    function getTypeAndSourceSetting(settings: Object = {}, type: string, source: string, defaultValue?: string|boolean): string|boolean {
      if (!type) {
        return defaultValue;
      }

      const isLog = type === 'log';
      const sourcePrefix =  `@@${type}:`;

      const value = settings[sourcePrefix + source];
      if (value) {
        return !isLog ? Utils.toBoolean(value) : value;
      }

      // check for wildcard match
      for (const key in settings) {
        if (Utils.startsWith(key.toLowerCase(), sourcePrefix.toLowerCase()) && Utils.isMatch(source, [key.substring(sourcePrefix.length)])) {
          return !isLog ? Utils.toBoolean(settings[key]) : settings[key];
        }
      }

      return defaultValue;
    }

    const ev = context.event;
    const log = context.log;
    const settings = context.client.config.settings;

    if (ev.type === 'log') {
      const minLogLevel = getMinLogLevel(settings, ev.source);
      const logLevel = getLogLevel(ev.data['@level']);

      if (logLevel >= 0 && (logLevel > 5 || logLevel < minLogLevel)) {
        log.info('Cancelling log event due to minimum log level.');
        context.cancelled = true;
      }
    } else if (ev.type === 'error') {
      let error: IInnerError = ev.data['@error'];
      while (!context.cancelled && error) {
        if (getTypeAndSourceSetting(settings, ev.type, error.type, true) === false) {
          log.info(`Cancelling error from excluded exception type: ${error.type}`);
          context.cancelled = true;
        }

        error = error.inner;
      }
    } else if (getTypeAndSourceSetting(settings, ev.type, ev.source, true) === false) {
      log.info(`Cancelling event from excluded type: ${ev.type} and source: ${ev.source}`);
      context.cancelled = true;
    }

    next && next();
  }
}
