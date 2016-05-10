import { IInnerError } from '../../models/IInnerError';
import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class EventExclusionPlugin implements IEventPlugin {
  public priority: number = 45;
  public name: string = 'EventExclusionPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    function getLogLevel(level: string): number {
      switch ((level || '').toLowerCase()) {
        case 'trace':
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
          return 6;
        default:
          return -1;
      }
    }

    function getMinLogLevel(settings: Object, loggerName: string = '*'): number {
      return getLogLevel(getTypeAndSourceSetting(settings, 'log', loggerName, 'Trace') + '');
    }

    function getTypeAndSourceSetting(settings: Object = {}, type: string, source: string, defaultValue: string|boolean = undefined): string|boolean {
      if (!type) {
        return defaultValue;
      }

      let isLog = type === 'log';
      let sourcePrefix =  `@@${type}:`;

      let value = settings[sourcePrefix + source];
      if (value) {
        return !isLog ? Utils.toBoolean(value) : value;
      }

      // check for wildcard match
      for (let key in settings) {
        if (Utils.startsWith(key.toLowerCase(), sourcePrefix.toLowerCase()) && Utils.isMatch(source, [key.substring(sourcePrefix.length)])) {
          return !isLog ? Utils.toBoolean(settings[key]) : settings[key];
        }
      }

      return defaultValue;
    }

    let ev = context.event;
    let log = context.log;
    let settings = context.client.config.settings;

    if (ev.type === 'log') {
      let minLogLevel = getMinLogLevel(settings, ev.source);
      let logLevel = getLogLevel(ev.data['@level']);

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
