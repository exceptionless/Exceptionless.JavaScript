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

import { fromError, StackFrame } from "stacktrace-js";

export class BrowserErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "BrowserErrorPlugin";

  public async run(context: EventPluginContext): Promise<void> {
    const exception = context.eventContext.getException();
    if (exception) {
      if (!context.event.type) {
        context.event.type = "error";
      }

      if (context.event.data && !context.event.data[KnownEventDataKeys.Error]) {
        const result = await this.parse(exception);
        if (result) {
          const exclusions = context.client.config.dataExclusions.concat(IgnoredErrorProperties);
          const additionalData = stringify(exception, exclusions);
          if (!isEmpty(additionalData)) {
            if (!result.data) {
              result.data = {};
            }

            result.data["@ext"] = JSON.parse(additionalData);
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
            is_native: frame.getIsNative() || (fileName && fileName[0] !== "/" && fileName[0] !== ".")
          }
        });
      }

      return frames;
    }

    const result: StackFrame[] = exception.stack ? await fromError(exception) : [];
    if (!result) {
      throw new Error("Unable to parse the exception stack trace");
    }

    // TODO: Test with reference error.
    return Promise.resolve({
      type: exception.name || "Error",
      message: exception.message,
      stack_trace: getStackFrames(result || [])
    });
  }
}
