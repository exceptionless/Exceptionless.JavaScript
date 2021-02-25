import { parse as fromError } from 'stack-trace'

import {
  EventPluginContext,
  IError,
  IErrorParser,
  IParameter,
  IStackFrame
} from '@exceptionless/core';

export class NodeErrorParser implements IErrorParser {
  public parse(context: EventPluginContext, exception: Error): Promise<IError> {
    function getParameters(parameters: string | string[]): IParameter[] {
      const params: string[] = (typeof parameters === 'string' ? [parameters] : parameters) || [];

      const items: IParameter[] = [];
      for (const param of params) {
        items.push({ name: param });
      }

      return items;
    }

    function getStackFrames(stackFrames: any[]): IStackFrame[] {
      const frames: IStackFrame[] = [];

      for (const frame of stackFrames) {
        frames.push({
          name: frame.getMethodName() || frame.getFunctionName(),
          parameters: getParameters(frame.getArgs()),
          file_name: frame.getFileName(),
          line_number: frame.getLineNumber() || 0,
          column: frame.getColumnNumber() || 0,
          declaring_type: frame.getTypeName(),
          data: {
            is_native: frame.isNative() || (frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
          }
        });
      }

      return frames;
    }

    const result = fromError(exception);
    if (!result) {
      throw new Error('Unable to parse the exception stack trace.');
    }

    return Promise.resolve({
      type: exception.name || 'Error',
      message: exception.message,
      stack_trace: getStackFrames(result || [])
    });
  }
}
