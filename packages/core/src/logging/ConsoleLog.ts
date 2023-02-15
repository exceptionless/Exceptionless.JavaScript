import { ILog } from "./ILog.js";

export class ConsoleLog implements ILog {
  public trace(message: string): void {
    this.log("debug", message);
  }

  public info(message: string): void {
    this.log("info", message);
  }

  public warn(message: string): void {
    this.log("warn", message);
  }

  public error(message: string): void {
    this.log("error", message);
  }

  private log(level: keyof Console, message: string) {
    if (console) {
      const msg = `Exceptionless:${new Date().toISOString()} [${level}] ${message}`;
      const logFn = console[level] as (msg: string) => void;
      if (logFn) {
        logFn(msg);
      } else if (console["log"]) {
        console["log"](msg);
      }
    }
  }
}
