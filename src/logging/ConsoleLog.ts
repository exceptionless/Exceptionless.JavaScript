import { ILog } from './ILog';

export class ConsoleLog implements ILog {
  public trace(message: string): void {
    this.log('trace', message);
  }

  public info(message: string): void {
    this.log('info', message);
  }

  public warn(message: string): void {
    this.log('warn', message);
  }

  public error(message: string): void {
    this.log('error', message);
  }

  private log(level: string, message: string) {
    if (console) {
      let msg = `[${level}] Exceptionless: ${message}`;

      if (console[level]) {
        console[level](msg);
      } else if (console.log) {
        console[`log`](msg);
      }
    }
  }
}
