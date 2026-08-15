import type { ILog } from "@exceptionless/core";

export interface LogEntry {
  timestamp: Date;
  level: "trace" | "info" | "warn" | "error";
  message: string;
}

export type LogCallback = (entry: LogEntry) => void;

/**
 * A decorator ILog that forwards all messages to an inner logger
 * and also notifies registered subscribers. Useful for building
 * debug UIs that display internal Exceptionless client logs.
 */
export class CallbackLog implements ILog {
  private _callbacks: LogCallback[] = [];

  constructor(private readonly _inner: ILog) {}

  public subscribe(callback: LogCallback): () => void {
    this._callbacks.push(callback);
    return () => {
      this._callbacks = this._callbacks.filter((c) => c !== callback);
    };
  }

  public trace(message: string): void {
    this._inner.trace(message);
    this._emit("trace", message);
  }

  public info(message: string): void {
    this._inner.info(message);
    this._emit("info", message);
  }

  public warn(message: string): void {
    this._inner.warn(message);
    this._emit("warn", message);
  }

  public error(message: string): void {
    this._inner.error(message);
    this._emit("error", message);
  }

  private _emit(level: LogEntry["level"], message: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message
    };
    for (const cb of this._callbacks) {
      try {
        cb(entry);
      } catch {
        // Subscriber errors must never break SDK logging
      }
    }
  }
}
