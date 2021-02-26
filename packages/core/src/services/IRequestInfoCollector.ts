import { RequestInfo } from "../models/data/RequestInfo.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";

export interface IRequestInfoCollector {
  getRequestInfo(context: EventPluginContext): RequestInfo;
}
