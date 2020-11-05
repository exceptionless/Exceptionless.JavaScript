import { IInnerError } from '../../models/IInnerError';
import { Utils } from '../../Utils';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class EventExclusionPlugin implements IEventPlugin {
  public priority: number = 45;
  public name: string = 'EventExclusionPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const ev = context.event;
    const log = context.log;
    const settings = context.client.config.settings;

    if (ev.type === 'log') {
      const minLogLevel = this.getMinLogLevel(settings, ev.source);
      const logLevel = this.getLogLevel(ev.data['@level']);

      if (logLevel >= 0 && (logLevel > 5 || logLevel < minLogLevel)) {
        log.info('Cancelling log event due to minimum log level.');
        context.cancelled = true;
      }
    } else if (ev.type === 'error') {
      let error: IInnerError = ev.data['@error'];
      while (!context.cancelled && error) {
        if (this.getTypeAndSourceSetting(settings, ev.type, error.type, true) === false) {
          log.info(`Cancelling error from excluded exception type: ${error.type}`);
          context.cancelled = true;
        }

        error = error.inner;
      }
    } else if (this.getTypeAndSourceSetting(settings, ev.type, ev.source, true) === false) {
      log.info(`Cancelling event from excluded type: ${ev.type} and source: ${ev.source}`);
      context.cancelled = true;
    }

    next && next();
  }

  public getLogLevel(level: string): number {
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

  public getMinLogLevel(configSettings: Record<string, string>, loggerName: string = '*'): number {
    return this.getLogLevel(this.getTypeAndSourceSetting(configSettings, 'log', loggerName, 'Trace') + '');
  }

  private getTypeAndSourceSetting(configSettings: Record<string, string> = {}, type: string, source: string, defaultValue?: string | boolean): string | boolean {
    if (!type) {
      return defaultValue;
    }

    const isLog = type === 'log';
    const sourcePrefix = `@@${type}:`;

    const value = configSettings[sourcePrefix + source];
    if (value) {
      return !isLog ? Utils.toBoolean(value) : value;
    }

    // check for wildcard match
    for (const key in configSettings) {
      if (Utils.startsWith(key.toLowerCase(), sourcePrefix.toLowerCase()) && Utils.isMatch(source, [key.substring(sourcePrefix.length)])) {
        return !isLog ? Utils.toBoolean(configSettings[key]) : configSettings[key];
      }
    }

    return defaultValue;
  }
}
