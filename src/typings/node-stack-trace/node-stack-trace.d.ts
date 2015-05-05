declare module 'stack-trace' {
  export interface StackFrame {
    getTypeName():string;
    getFunctionName():string;
    getMethodName():string;
    getFileName():string;
    getTypeName():string;
    getLineNumber():number;
    getColumnNumber():number;
    isNative():boolean;
  }

  export function get(belowFn:() => void): StackFrame[];
  export function parse(err:Error): StackFrame[];
}
