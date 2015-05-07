import { IError } from '../models/IError';
import { IErrorParser } from 'IErrorParser';
import { IStackFrame } from '../models/IStackFrame';
import { EventPluginContext } from '../plugins/EventPluginContext';

export class WebErrorParser implements IErrorParser {
  public parse(context:EventPluginContext, exception:Error): Promise<IError> {
    return StackTrace.fromError(exception).then(
      (stackFrames: StackTrace.StackFrame[]) => this.processError(context, exception, stackFrames),
      (error) => this.onParseError(error, context)
    );
  }

  private processError(context:EventPluginContext, exception:Error, stackFrames: StackTrace.StackFrame[]): Promise<any> {
    var error:IError = {
      message: exception.message,
      stack_trace: this.getStackFrames(context, stackFrames || [])
    };

    context.event.data['@error'] = error;

    return Promise.resolve();
  }

  private onParseError(error:Error, context:EventPluginContext): Promise<any>  {
    context.cancel = true;
    var message = 'Unable to parse the exceptions stack trace';
    context.log.error(`${message}: ${error.message}`);
    return Promise.reject(new Error(`${message}. This exception will be discarded.`))
  }

  private getStackFrames(context:EventPluginContext, stackFrames:StackTrace.StackFrame[]): IStackFrame[] {
    var frames:IStackFrame[] = [];

    for (var index = 0; index < stackFrames.length; index++) {
      frames.push({
        name: stackFrames[index].functionName,
        parameters: stackFrames[index].args, // TODO: need to verify arguments.
        file_name: stackFrames[index].fileName,
        line_number: stackFrames[index].lineNumber,
        column: stackFrames[index].columnNumber
      });
    }

    return frames;
  }
}
