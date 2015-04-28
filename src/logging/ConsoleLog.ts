import { ILog } from './ILog';

export class ConsoleLog implements ILog {
  public info(message) {
    if (console && console.log) {
      console.log('[INFO] Exceptionless:' + message)
    }
  }

  public warn(message) {
    if (console && console.log) {
      console.log('[Warn] Exceptionless:' + message)
    }
  }

  public error(message) {
    if (console && console.log) {
      console.log('[Error] Exceptionless:' + message)
    }
  }
}
