import { IError } from '../models/IError.js';
import { EventPluginContext } from '../plugins/EventPluginContext.js';

export interface IErrorParser {
  parse(context: EventPluginContext, exception: Error): IError;
}
