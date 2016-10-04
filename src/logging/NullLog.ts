import { ILog } from './ILog';

export class NullLog implements ILog {
  public trace(message: string): void { }
  public info(message: string): void { }
  public warn(message: string): void { }
  public error(message: string): void { }
}
