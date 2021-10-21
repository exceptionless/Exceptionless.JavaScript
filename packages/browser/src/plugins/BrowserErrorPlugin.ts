import {
  ErrorInfo,
  EventPluginContext,
  IEventPlugin,
  IgnoredErrorProperties,
  KnownEventDataKeys,
  ParameterInfo,
  StackFrameInfo,
  stringify,
  isEmpty
} from "@exceptionless/core";

// @ts-expect-error TS7016
import { StackTraceJs } from "./stacktracejs/stacktrace.js";

export class BrowserErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "BrowserErrorPlugin";

  public async run(context: EventPluginContext): Promise<void> {
    const exception = context.eventContext.getException();
    if (exception) {
      context.event.type = "error";

      if (context.event.data && !context.event.data[KnownEventDataKeys.Error]) {
        const result = await this.parse(exception);
        if (result) {
          const exclusions = context.client.config.dataExclusions.concat(IgnoredErrorProperties);
          const additionalData = JSON.parse(stringify(exception, exclusions)) as unknown;
          if (!isEmpty(additionalData)) {
            if (!result.data) {
              result.data = {};
            }
            result.data["@ext"] = additionalData;
          }

          context.event.data[KnownEventDataKeys.Error] = result;
        }
      }
    }
  }

  public async parse(exception: Error): Promise<ErrorInfo> {
    function getParameters(parameters: string | string[]): ParameterInfo[] {
      const params: string[] = (typeof parameters === "string" ? [parameters] : parameters) || [];

      const items: ParameterInfo[] = [];
      for (const param of params) {
        items.push({ name: param });
      }

      return items;
    }

    function getStackFrames(stackFrames: StackTraceJs.StackFrame[]): StackFrameInfo[] {
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
            is_native: frame.getIsNative() || (fileName && fileName[0] !== "/" && fileName[0] !== ".")
          }
        });
      }

      return frames;
    }

    const result: StackTraceJs.StackFrame[] = await StackTraceJs.fromError(exception);
    if (!result) {
      throw new Error("Unable to parse the exception stack trace.");
    }

    // TODO: Test with reference error.
    return Promise.resolve({
      type: exception.name || "Error",
      message: exception.message,
      stack_trace: getStackFrames(result || [])
    });
  }
}
