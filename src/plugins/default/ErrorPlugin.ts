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
