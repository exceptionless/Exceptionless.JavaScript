import {
  IEventPlugin,
  ErrorInfo,
  EventPluginContext,
  KnownEventDataKeys,
  IgnoredErrorProperties,
  isEmpty,
  StackFrameInfo,
  stringify
} from "@exceptionless/core";

import { parse as fromError } from "stack-trace";

export class NodeErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "NodeErrorPlugin";

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

  private parse(exception: Error): Promise<ErrorInfo> {
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
