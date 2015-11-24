import { ILog } from './ILog';

export class ConsoleLog implements ILog {
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
    if (console && console[level]) {
      console[level](`[${level}] Exceptionless: ${message}`);
    }
  }
}
