import { IMethod } from './IMethod.js';

export interface IStackFrame extends IMethod {
  file_name?: string;
  line_number?: number;
  column?: number;
}
