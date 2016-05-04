import { IInnerError } from '../../models/IInnerError';
import { ILog } from '../../logging/ILog';
import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority: number = 40;
  public name: string = 'DuplicateCheckerPlugin';

  private _processedHashcodes: TimestampedHash[] = [];
  private _getCurrentTime: () => number;

  constructor(getCurrentTime:() => number = () => Date.now()) {
    this._getCurrentTime = getCurrentTime;
  }

  public run(context: EventPluginContext, next?: () => void): void {
    function isDuplicate(error: IInnerError, processedHashcodes, now, log: ILog): boolean {
      while (error) {
        let hashCode = Utils.getHashCode(error.stack_trace && JSON.stringify(error.stack_trace));

        // Only process the unique errors times within a 2 second window.
        if (hashCode && processedHashcodes.some(h => h.hash === hashCode && h.timestamp >= (now - 2000))) {
          log.info(`Ignoring duplicate error event hash: ${hashCode}`);
          return true;
        }

        // Add this exception to our list of recent processed errors.
        processedHashcodes.push({ hash: hashCode, timestamp: now });

        // Only keep the last 20 recent errors.
        while (processedHashcodes.length > 20) {
          processedHashcodes.shift();
        }

        error = error.inner;
      }

      return false;
    }

    if (context.event.type === 'error') {
      if (isDuplicate(context.event.data['@error'], this._processedHashcodes, this._getCurrentTime(), context.log)) {
        context.cancelled = true;
        return;
      }
    }

    next && next();
  }
}

interface TimestampedHash {
  hash: number;
  timestamp: number;
}
