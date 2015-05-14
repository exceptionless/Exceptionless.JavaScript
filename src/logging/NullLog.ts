import { ILog } from './ILog';

export class NullLog implements ILog {
  public info(message):void {}
  public warn(message):void {}
  public error(message):void {}
}
