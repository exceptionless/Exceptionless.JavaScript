import { IError } from '../models/IError';
import { IParameter } from '../models/IParameter';
import { IErrorParser } from 'IErrorParser';
import { IStackFrame } from '../models/IStackFrame';
import { EventPluginContext } from '../plugins/EventPluginContext';

export class DefaultErrorParser implements IErrorParser {
  public parse(context:EventPluginContext, exception:Error): IError {
    function getParameters(parameters:string|string[]): IParameter[] {
      var params:string[] = (typeof parameters === 'string' ? [parameters] : parameters) || [];

      var result:IParameter[] = [];
      for (var index = 0; index < params.length; index++) {
        result.push({ name: params[index] })
      }

      return result;
    }

    function getStackFrames(context:EventPluginContext, stackFrames:TraceKit.StackFrame[]): IStackFrame[] {
      const ANONYMOUS:string = '<anonymous>';
      var frames:IStackFrame[] = [];

      for (var index = 0; index < stackFrames.length; index++) {
        var frame = stackFrames[index];
        frames.push({
          name: (frame.func || ANONYMOUS).replace('?', ANONYMOUS),
          parameters: getParameters(frame.args),
          file_name: frame.url,
          line_number: frame.line,
          column: frame.column
        });
      }

      return frames;
    }

    const TRACEKIT_STACK_TRACE_KEY:string = '@@_TraceKit.StackTrace'; // optimization for minifier.

    var stackTrace:TraceKit.StackTrace = !!context.contextData[TRACEKIT_STACK_TRACE_KEY]
      ? context.contextData[TRACEKIT_STACK_TRACE_KEY]
      : TraceKit.computeStackTrace(exception, 25);

    if (!stackTrace) {
      throw new Error('Unable to parse the exceptions stack trace.');
    }

    return {
      type: stackTrace.name,
      message: stackTrace.message || exception.message,
      stack_trace: getStackFrames(context, stackTrace.stack || [])
    };
  }
}
