import { InnerErrorInfo } from "../../models/data/ErrorInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";
import { getHashCode } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority = 1010;
  public name = "DuplicateCheckerPlugin";

  private _mergedEvents: MergedEvent[] = [];
  private _processedHashCodes: TimestampedHash[] = [];
  private _getCurrentTime: () => number;
  private _intervalId: ReturnType<typeof setInterval> | undefined;
  private _interval: number;

  constructor(
    getCurrentTime: () => number = () => Date.now(),
    interval: number = 30000
  ) {
    this._getCurrentTime = getCurrentTime;
    this._interval = interval;
  }

  public startup(): Promise<void> {
    clearInterval(this._intervalId);
    this._intervalId = setInterval(() => void this.submitEvents(), this._interval);
    return Promise.resolve();
  }

  public async suspend(): Promise<void> {
    clearInterval(this._intervalId);
    this._intervalId = undefined;
    await this.submitEvents();
  }

  public run(context: EventPluginContext): Promise<void> {
    function calculateHashCode(error: InnerErrorInfo | undefined): number {
      let hash = 0;
      while (error) {
        if (error.message && error.message.length) {
          hash += (hash * 397) ^ getHashCode(error.message);
        }
        if (error.stack_trace && error.stack_trace.length) {
          hash += (hash * 397) ^ getHashCode(JSON.stringify(error.stack_trace));
        }
        error = error.inner;
      }

      return hash;
    }

    const error = context.event.data?.[KnownEventDataKeys.Error];
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
      await this._mergedEvents.shift()?.resubmit();
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

  public updateDate(date?: Date): void {
    const ev = this._context.event;
    if (date && ev.date && date > ev.date) {
      ev.date = date;
    }
  }
}
