import { IMethod } from './IMethod';

export interface IStackFrame extends IMethod {
  file_name?: string;
  line_number?: number;
  column?: number;
}
