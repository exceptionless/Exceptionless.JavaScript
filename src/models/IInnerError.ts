/// <reference path="../references.ts" />

module Exceptionless {
  export interface IInnerError {
    message?:string;
    type?:string;
    code?:string;
    data?:any;
    inner?:IInnerError
    stack_trace?:IStackFrame[];
    target_method?:IMethod;
  }
}
