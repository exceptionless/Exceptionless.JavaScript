import { ILog } from './ILog';

export class NullLog implements ILog {
  public info(message: string): void { }
  public warn(message: string): void { }
  public error(message: string): void { }
}
