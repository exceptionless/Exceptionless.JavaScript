/* eslint-disable @typescript-eslint/no-unused-vars */
import { ILog } from "./ILog.js";

export class NullLog implements ILog {
  public trace(_: string): void { /* empty */ }
  public info(_: string): void { /* empty */ }
  public warn(_: string): void { /* empty */ }
  public error(_: string): void { /* empty */ }
}
