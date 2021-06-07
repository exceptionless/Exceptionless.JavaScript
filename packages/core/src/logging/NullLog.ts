/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { ILog } from "./ILog.js";

export class NullLog implements ILog {
  public trace(_: string): void { }
  public info(_: string): void { }
  public warn(_: string): void { }
  public error(_: string): void { }
}
