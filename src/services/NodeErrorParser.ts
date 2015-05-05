import { IError } from '../models/IError';
import { IErrorParser } from 'IErrorParser';
import { IStackFrame } from '../models/IStackFrame';
import { EventPluginContext } from '../plugins/EventPluginContext';

import stacktrace = require('stack-trace');

export class NodeErrorParser implements IErrorParser {
  public parse(context:EventPluginContext, exception:Error): Promise<IError> {
    if (!stacktrace) {
      context.cancel = true;
      return Promise.reject(new Error('Unable to load the stack trace library. This exception will be discarded.'))
    }

    var stackFrames = stacktrace.parse(exception);
    if (!stackFrames || stackFrames.length === 0) {
      context.cancel = true;
      return Promise.reject(new Error('Unable to parse the exceptions stack trace. This exception will be discarded.'))
    }

    var error:IError = {
      message: exception.message,
      stack_trace: this.getStackFrames(context, stackFrames || [])
    };

    context.event.data['@error'] = error;
    return Promise.resolve();
  }

  private getStackFrames(context:EventPluginContext, stackFrames:any[]): IStackFrame[] {
    var frames:IStackFrame[] = [];

    for (var index = 0; index < stackFrames.length; index++) {
      var frame = stackFrames[index];
      frames.push({
        name: frame.getMethodName() || frame.getFunctionName(),
        //parameters: stackFrames[index].args,
        file_name: frame.getFileName(),
        line_number: frame.getLineNumber(),
        column: frame.getColumnNumber(),
        declaring_type: frame.getTypeName(),
        data: {
          is_native: frame.isNative() || (frame.filename[0] !== '/' && frame.filename[0] !== '.')
        }
      });
    }

    return frames;
  }
}
