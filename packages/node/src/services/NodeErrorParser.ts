import { parse as fromError } from "stack-trace";

import {
  ErrorInfo,
  EventPluginContext,
  IErrorParser,
  StackFrameInfo,
} from "@exceptionless/core";

export class NodeErrorParser implements IErrorParser {
  public parse(context: EventPluginContext, exception: Error): Promise<ErrorInfo> {
    function getStackFrames(stackFrames: any[]): StackFrameInfo[] {
      const frames: StackFrameInfo[] = [];

      for (const frame of stackFrames) {
        frames.push({
          name: frame.methodName || frame.functionName,
          parameters: [], // TODO: See if there is a way to get this.
          file_name: frame.fileName,
          line_number: frame.lineNumber || 0,
          column: frame.columnNumber || 0,
          declaring_type: frame.typeName,
          data: {
            is_native: frame.native || (frame.fileName && frame.fileName[0] !== "/" && frame.fileName[0] !== "."),
          },
        });
      }

      return frames;
    }

    const result = fromError(exception);
    if (!result) {
      throw new Error("Unable to parse the exception stack trace.");
    }

    return Promise.resolve({
      type: exception.name || "Error",
      message: exception.message,
      stack_trace: getStackFrames(result || []),
    });
  }
}
