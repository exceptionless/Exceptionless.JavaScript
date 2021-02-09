import { IError } from '@exceptionless/core/models/IError';
import { IStackFrame } from '@exceptionless/core/models/IStackFrame';
import { EventPluginContext } from '@exceptionless/core/plugins/EventPluginContext';
import { IErrorParser } from '@exceptionless/core/services/IErrorParser';
import { parse } from 'stack-trace'


export class NodeErrorParser implements IErrorParser {
  public parse(context: EventPluginContext, exception: Error): IError {
    function getStackFrames(frames: any[]): IStackFrame[] {
      const result: IStackFrame[] = [];

      for (const frame of frames) {
        result.push({
          name: frame.getMethodName() || frame.getFunctionName(),
          // parameters: frame.args,
          file_name: frame.getFileName(),
          line_number: frame.getLineNumber() || 0,
          column: frame.getColumnNumber() || 0,
          declaring_type: frame.getTypeName(),
          data: {
            is_native: frame.isNative() || (frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
          }
        });
      }

      return result;
    }

    if (!parse) {
      throw new Error('Unable to load the stack trace library.');
    }

    const stackFrames = parse(exception) || [];
    return {
      type: exception.name || 'Error',
      message: exception.message,
      stack_trace: getStackFrames(stackFrames)
    };
  }
}
