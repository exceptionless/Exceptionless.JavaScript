import { IError } from '../models/IError';
import { EventPluginContext } from '../plugins/EventPluginContext';

export interface IErrorParser {
  parse(context: EventPluginContext, exception: Error): IError;
}
