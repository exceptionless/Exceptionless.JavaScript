import { IInnerError } from '../../models/IInnerError';
import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority: number = 1010;
  public name: string = 'DuplicateCheckerPlugin';

  private _mergedEvents: MergedEvent[] = [];
  private _processedHashcodes: TimestampedHash[] = [];
  private _getCurrentTime: () => number;
  private _interval: number;

  constructor(getCurrentTime: () => number = () => Date.now(), interval: number = 60000) {
    this._getCurrentTime = getCurrentTime;
    this._interval = interval;

    setInterval(() => {
      while (this._mergedEvents.length > 0) {
        this._mergedEvents.shift().resubmit();
      }
    }, interval);
  }

  public run(context: EventPluginContext, next?: () => void): void {
    function getHashCode(error: IInnerError): number {
      let hashCode = 0;

      while (error) {
        if (error.stack_trace && error.stack_trace.length) {
          hashCode += (hashCode * 397) ^ Utils.getHashCode(error.message);
          hashCode += (hashCode * 397) ^ Utils.getHashCode(JSON.stringify(error.stack_trace));
        }
        error = error.inner;
      }

      return hashCode;
    }

    let error = context.event.data['@error'];
    let hashCode = getHashCode(error);

    if (!hashCode) {
      return;
    }

    let count = context.event.count || 1;
    let now = this._getCurrentTime();

    let merged = this._mergedEvents.filter(s => s.hashCode === hashCode)[0];
    if (merged) {
      merged.incrementCount(count);
      merged.updateDate(context.event.date);
      context.log.info("Ignoring duplicate event with hash: " + hashCode);
      context.cancelled = true;
      return;
    }

    if (this._processedHashcodes.some(h => h.hash === hashCode && h.timestamp >= (now - this._interval))) {
      context.log.info("Adding event with hash: " + hashCode);
      this._mergedEvents.push(new MergedEvent(hashCode, context, count));
      context.cancelled = true;
      return;
    }

    context.log.info("Enqueueing event with hash: " + hashCode + "to cache.");
    this._processedHashcodes.push({ hash: hashCode, timestamp: now });

    // Only keep the last 50 recent errors.
    while (this._processedHashcodes.length > 50) {
      this._processedHashcodes.shift();
    }

    next && next();
  }
}

interface TimestampedHash {
  hash: number;
  timestamp: number;
}

class MergedEvent {
  public hashCode: number;
  private _count: number;
  private _context: EventPluginContext;

  constructor(hashCode: number, context: EventPluginContext, count: number) {
    this.hashCode = hashCode;
    this._context = context;
    this._count = count;
  }

  public incrementCount(count: number) {
    this._count += count;
  }

  public resubmit() {
    this._context.event.count = this._count;
    this._context.client.config.queue.enqueue(this._context.event);
  }

  public updateDate(date) {
    if (date > this._context.event.date) {
      this._context.event.date = date;
    }
  }
}
