/// <reference path="../references.ts" />

module Exceptionless {
  export interface IStackFrame extends IMethod {
    file_name:string;
    line_number:number;
    column:number;
  }
}
