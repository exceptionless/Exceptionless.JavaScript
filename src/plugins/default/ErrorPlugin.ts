/// <reference path="../../references.ts" />

module Exceptionless {
  export class ErrorPlugin implements IEventPlugin {
    public priority:number = 30;
    public name:string = 'ErrorPlugin';

    run(context:Exceptionless.EventPluginContext): Promise<any> {
      var exception = context.contextData.getException();
      if (exception == null) {
        return Promise.resolve();
      }

      if (!context.event.data) {
        context.event.data = {};
      }

      context.event.type = 'error';
      if (!!context.event.data['@error']) {
        return Promise.resolve();
      }

      return StackTrace.fromError(exception).then(
        (stackFrames: StackTrace.StackFrame[]) => this.processError(context, exception, stackFrames),
        () => this.onParseError(context)
      );
    }

    private processError(context:Exceptionless.EventPluginContext, exception:Error, stackFrames: StackTrace.StackFrame[]): Promise<any> {
      var error:IError = {
        message: exception.message,
        stack_trace: this.getStackFrames(context, stackFrames || [])
      };

      context.event.data['@error'] = error;

      return Promise.resolve();
    }

    private onParseError(context:Exceptionless.EventPluginContext): Promise<any>  {
      context.cancel = true;
      return Promise.reject(new Error('Unable to parse the exceptions stack trace. This exception will be discarded.'))
    }

    private getStackFrames(context:Exceptionless.EventPluginContext, stackFrames:StackTrace.StackFrame[]): IStackFrame[] {
      var frames:IStackFrame[] = [];

      for (var index = 0; index < stackFrames.length; index++) {
        frames.push({
          name: stackFrames[index].functionName,
          //parameters: stackFrames[index].args, // TODO: need to verify arguments.
          file_name: stackFrames[index].fileName,
          line_number: stackFrames[index].lineNumber,
          column: stackFrames[index].columnNumber
        });
      }

      return frames;
    }
  }
}

declare module StackTrace {
  interface StackTraceOptions {
    filter?: (stackFrame:StackFrame) => boolean;
    sourceCache?: { URL:string };
    offline?: boolean;
  }

  interface StackFrame {
    constructor(functionName:string, args:any, fileName:string, lineNumber:number, columnNumber:number);

    functionName?:string;
    args?:any;
    fileName?:string;
    lineNumber?:number;
    columnNumber?:number;
    toString():string;
  }

  /**
   * Get a backtrace from invocation point.
   * @param options Options Object
   * @return Array[StackFrame]
   */
  function get(options: StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Given an error object, parse it.
   * @param error Error object
   * @param options Object for options
   * @return Array[StackFrame]
   */
  function fromError(error:Error, options?:StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Use StackGenerator to generate a backtrace.
   * @param options Object options
   * @returns Array[StackFrame]
   */
  function generateArtificially(options: StackTraceOptions): Promise<StackFrame[]>;

  /**
   * Given a function, wrap it such that invocations trigger a callback that
   * is called with a stack trace.
   *
   * @param {Function} fn to be instrumented
   * @param {Function} callback function to call with a stack trace on invocation
   * @param {Function} errorCallback optional function to call with error if unable to get stack trace.
   * @param {Object} thisArg optional context object (e.g. window)
   */
  function instrument(fn:() => void, callback:(stackFrames:StackFrame[]) => void, errorCallback:() => void, thisArg:any): void;

  /**
   * Given a function that has been instrumented,
   * revert the function to it's original (non-instrumented) state.
   *
   * @param fn {Function}
   */
  function deinstrument(fn:() => void): void;
}
