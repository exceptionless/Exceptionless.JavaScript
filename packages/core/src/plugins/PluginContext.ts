import { ExceptionlessClient } from "../ExceptionlessClient.js";
import { ILog } from "../logging/ILog.js";


export class PluginContext {
  constructor(public client: ExceptionlessClient) { }

  public get log(): ILog {
    return this.client.config.log;
  }
}
