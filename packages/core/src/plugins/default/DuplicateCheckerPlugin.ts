import { InnerErrorInfo } from "../../models/data/ErrorInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { getHashCode } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";
import { PluginContext } from "../PluginContext.js";

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority: number = 1010;
  public name: string = "DuplicateCheckerPlugin";

  private _mergedEvents: MergedEvent[] = [];
  private _processedHashCodes: TimestampedHash[] = [];
  private _getCurrentTime: () => number;
  private _intervalId: any;
  private _interval: number;

  constructor(
    getCurrentTime: () => number = () => Date.now(),
    interval: number = 30000
  ) {
    this._getCurrentTime = getCurrentTime;
    this._interval = interval;
  }

  public startup(context: PluginContext): Promise<void> {
    this._intervalId = clearInterval(this._intervalId);
    this._intervalId = setInterval(() => void this.submitEvents(), this._interval);
    return Promise.resolve();
  }

  public async suspend(context: PluginContext): Promise<void> {
    this._intervalId = clearInterval(this._intervalId);
    await this.submitEvents();
  }

  public run(context: EventPluginContext): Promise<void> {
    function calculateHashCode(e: InnerErrorInfo): number {
      let hash = 0;
      while (e) {
        if (e.message && e.message.length) {
          hash += (hash * 397) ^ getHashCode(e.message);
        }
        if (e.stack_trace && e.stack_trace.length) {
          hash += (hash * 397) ^ getHashCode(JSON.stringify(e.stack_trace));
        }
        e = e.inner;
      }

      return hash;
    }

    const error = context.event.data[KnownEventDataKeys.Error];
    const hashCode = calculateHashCode(error);
    if (hashCode) {
      const count = context.event.count || 1;
      const now = this._getCurrentTime();

      const merged = this._mergedEvents.filter((s) => s.hashCode === hashCode)[0];
      if (merged) {
        merged.incrementCount(count);
        merged.updateDate(context.event.date);
        context.log.info("Ignoring duplicate event with hash: " + hashCode);
        context.cancelled = true;
      }

      if (
        !context.cancelled &&
        this._processedHashCodes.some((h) =>
          h.hash === hashCode && h.timestamp >= (now - this._interval)
        )
      ) {
        context.log.trace("Adding event with hash: " + hashCode);
        this._mergedEvents.push(new MergedEvent(hashCode, context, count));
        context.cancelled = true;
      }

      if (!context.cancelled) {
        context.log.trace(`Enqueueing event with hash: ${hashCode} to cache`);
        this._processedHashCodes.push({ hash: hashCode, timestamp: now });

        // Only keep the last 50 recent errors.
        while (this._processedHashCodes.length > 50) {
          this._processedHashCodes.shift();
        }
      }
    }

    return Promise.resolve();
  }

  private async submitEvents(): Promise<void> {
    while (this._mergedEvents.length > 0) {
      await this._mergedEvents.shift().resubmit();
    }
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

  public incrementCount(count: number): void {
    this._count += count;
  }

  public async resubmit(): Promise<void> {
    this._context.event.count = this._count;
    await this._context.client.config.services.queue.enqueue(this._context.event);
  }

  public updateDate(date: Date): void {
    if (date > this._context.event.date) {
      this._context.event.date = date;
    }
  }
}
