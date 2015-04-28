import { ILog } from './ILog';

export class NullLog implements ILog {
  public info(message) {}
  public warn(message) {}
  public error(message) {}
}
