import { ErrorInfo } from "../models/data/ErrorInfo.js";
import { EventPluginContext } from "../plugins/EventPluginContext.js";

export interface IErrorParser {
  parse(context: EventPluginContext, exception: ErrorInfo): Promise<ErrorInfo>;
}