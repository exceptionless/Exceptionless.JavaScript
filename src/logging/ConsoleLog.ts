import { ILog } from './ILog';

export class ConsoleLog implements ILog {
  public info(message):void {
    this.log('info', message);
  }

  public warn(message):void {
    this.log('warn', message);
  }

  public error(message):void {
    this.log('error', message);
  }

  private log(level:string, message:string) {
    if (console && console[level]) {
      console[level](`[${level}] Exceptionless: ${message}`);
    }
  }
}
