import * as TraceKit from 'TraceKit';
import { IError } from '../models/IError';
import { IParameter } from '../models/IParameter';
import { IStackFrame } from '../models/IStackFrame';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { IErrorParser } from './IErrorParser';

export class DefaultErrorParser implements IErrorParser {
  public parse(context: EventPluginContext, exception: Error): IError {
    function getParameters(parameters: string | string[]): IParameter[] {
      const params: string[] = (typeof parameters === 'string' ? [parameters] : parameters) || [];

      const result: IParameter[] = [];
      for (const param of params) {
        result.push({ name: param });
      }

      return result;
    }

    function getStackFrames(stackFrames: TraceKit.StackFrame[]): IStackFrame[] {
      const ANONYMOUS: string = '<anonymous>';
      const frames: IStackFrame[] = [];

      for (const frame of stackFrames) {
        frames.push({
          name: (frame.func || ANONYMOUS).replace('?', ANONYMOUS),
          parameters: getParameters(frame.args),
          file_name: frame.url,
          line_number: frame.line || 0,
          column: frame.column || 0
        });
      }

      return frames;
    }

    const TRACEKIT_STACK_TRACE_KEY: string = '@@_TraceKit.StackTrace'; // optimization for minifier.

    const stackTrace: TraceKit.StackTrace = !!context.contextData[TRACEKIT_STACK_TRACE_KEY]
      ? context.contextData[TRACEKIT_STACK_TRACE_KEY]
      : TraceKit.computeStackTrace(exception, 25);

    if (!stackTrace) {
      throw new Error('Unable to parse the exceptions stack trace.');
    }

    const message = typeof(exception) === 'string' ? exception as any : undefined;
    return {
      type: stackTrace.name || 'Error',
      message: stackTrace.message || exception.message || message,
      stack_trace: getStackFrames(stackTrace.stack || [])
    };
  }
}
