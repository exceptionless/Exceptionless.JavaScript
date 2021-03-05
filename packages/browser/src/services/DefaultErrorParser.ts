import {
  ErrorInfo,
  EventPluginContext,
  IErrorParser,
  ParameterInfo,
  StackFrameInfo,
} from "@exceptionless/core";

import { fromError, StackFrame } from "stacktrace-js";

export class DefaultErrorParser implements IErrorParser {
  public async parse(
    context: EventPluginContext,
    exception: Error,
  ): Promise<ErrorInfo> {
    function getParameters(parameters: string | string[]): ParameterInfo[] {
      const params: string[] =
        (typeof parameters === "string" ? [parameters] : parameters) || [];

      const items: ParameterInfo[] = [];
      for (const param of params) {
        items.push({ name: param });
      }

      return items;
    }

    function getStackFrames(stackFrames: StackFrame[]): StackFrameInfo[] {
      const ANONYMOUS: string = "<anonymous>";
      const frames: StackFrameInfo[] = [];

      for (const frame of stackFrames) {
        const fileName: string = frame.getFileName();
        frames.push({
          name: (frame.getFunctionName() || ANONYMOUS).replace("?", ANONYMOUS),
          parameters: getParameters(frame.getArgs()),
          file_name: fileName,
          line_number: frame.getLineNumber() || 0,
          column: frame.getColumnNumber() || 0,
          data: {
            is_native: frame.getIsNative() ||
              (fileName && fileName[0] !== "/" && fileName[0] !== "."),
          },
        });
      }

      return frames;
    }

    const result: StackFrame[] = await fromError(exception);
    if (!result) {
      throw new Error("Unable to parse the exception stack trace.");
    }

    // TODO: Test with reference error.
    return Promise.resolve({
      type: exception.name || "Error",
      message: exception.message,
      stack_trace: getStackFrames(result || []),
    });
  }
}
