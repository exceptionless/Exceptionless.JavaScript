import { IInnerError } from '../../models/IInnerError';
import { Utils } from '../../Utils';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority: number = 1010;
  public name: string = 'DuplicateCheckerPlugin';

  private _mergedEvents: MergedEvent[] = [];
  private _processedHashcodes: TimestampedHash[] = [];
  private _getCurrentTime: () => number;
  private _interval: number;

  constructor(getCurrentTime: () => number = () => Date.now(), interval: number = 30000) {
    this._getCurrentTime = getCurrentTime;
    this._interval = interval;

    setInterval(() => {
      while (this._mergedEvents.length > 0) {
        this._mergedEvents.shift().resubmit();
      }
    }, interval);
  }

  public run(context: EventPluginContext, next?: () => void): void {
    function getHashCode(e: IInnerError): number {
      let hash = 0;
      while (e) {
        if (e.message && e.message.length) {
          hash += (hash * 397) ^ Utils.getHashCode(e.message);
        }
        if (e.stack_trace && e.stack_trace.length) {
          hash += (hash * 397) ^ Utils.getHashCode(JSON.stringify(e.stack_trace));
        }
        e = e.inner;
      }

      return hash;
    }

    const error = context.event.data['@error'];
    const hashCode = getHashCode(error);
    if (hashCode) {
      const count = context.event.count || 1;
      const now = this._getCurrentTime();

      const merged = this._mergedEvents.filter((s) => s.hashCode === hashCode)[0];
      if (merged) {
        merged.incrementCount(count);
        merged.updateDate(context.event.date);
        context.log.info('Ignoring duplicate event with hash: ' + hashCode);
        context.cancelled = true;
      }

      if (!context.cancelled && this._processedHashcodes.some((h) => h.hash === hashCode && h.timestamp >= (now - this._interval))) {
        context.log.trace('Adding event with hash: ' + hashCode);
        this._mergedEvents.push(new MergedEvent(hashCode, context, count));
        context.cancelled = true;
      }

      if (!context.cancelled) {
        context.log.trace('Enqueueing event with hash: ' + hashCode + 'to cache.');
        this._processedHashcodes.push({ hash: hashCode, timestamp: now });

        // Only keep the last 50 recent errors.
        while (this._processedHashcodes.length > 50) {
          this._processedHashcodes.shift();
        }
      }
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
