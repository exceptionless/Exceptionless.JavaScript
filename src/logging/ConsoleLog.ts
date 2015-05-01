import { ILog } from './ILog';

export class ConsoleLog implements ILog {
  public info(message) {
    if (console && console.info) {
      console.info(`[INFO] Exceptionless:${message}`)
    }
  }

  public warn(message) {
    if (console && console.warn) {
      console.warn(`[Warn] Exceptionless:${message}`)
    }
  }

  public error(message) {
    if (console && console.error) {
      console.error(`[Error] Exceptionless:${message}`)
    }
  }
}
