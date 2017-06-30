import { IError } from '../models/IError';
import { IStackFrame } from '../models/IStackFrame';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { IErrorParser } from './IErrorParser';

import nodestacktrace = require('stack-trace');

export class NodeErrorParser implements IErrorParser {
  public parse(context: EventPluginContext, exception: Error): IError {
    function getStackFrames(stackFrames: any[]): IStackFrame[] {
      const frames: IStackFrame[] = [];

      for (const frame of stackFrames) {
        frames.push({
          name: frame.getMethodName() || frame.getFunctionName(),
          // parameters: frame.args,
          file_name: frame.getFileName(),
          line_number: frame.getLineNumber() || 0,
          column: frame.getColumnNumber() || 0,
          declaring_type: frame.getTypeName(),
          data: {
            is_native: frame.isNative() || (!!frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
          }
        });
      }

      return frames;
    }

    if (!nodestacktrace) {
      throw new Error('Unable to load the stack trace library.');
    }

    const stackFrames = nodestacktrace.parse(exception) || [];
    return {
      type: exception.name || 'Error',
      message: exception.message,
      stack_trace: getStackFrames(stackFrames)
    };
  }
}
