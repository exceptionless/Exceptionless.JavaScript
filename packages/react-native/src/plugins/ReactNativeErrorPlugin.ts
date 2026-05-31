import {
  ErrorInfo,
  EventPluginContext,
  IEventPlugin,
  IgnoredErrorProperties,
  isEmpty,
  KnownEventDataKeys,
  StackFrameInfo,
  stringify
} from "@exceptionless/core";

interface ParsedLocation {
  fileName: string;
  lineNumber: number;
  column: number;
  isNative: boolean;
}

const ReactComponentStackContextKey = "@@_ComponentStack";
const ReactComponentStackDataKey = "@component_stack";

export class ReactNativeErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "ReactNativeErrorPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const exception = context.eventContext.getException();
    if (exception) {
      if (!context.event.type) {
        context.event.type = "error";
      }

      if (context.event.data && !context.event.data[KnownEventDataKeys.Error]) {
        const result = this.parse(exception);
        const exclusions = context.client.config.dataExclusions.concat(IgnoredErrorProperties);
        const additionalData = stringify(exception, exclusions);
        if (!isEmpty(additionalData)) {
          result.data = result.data ?? {};
          result.data["@ext"] = JSON.parse(additionalData);
        }

        const componentStack = context.eventContext[ReactComponentStackContextKey];
        if (typeof componentStack === "string" && componentStack) {
          result.data = result.data ?? {};
          result.data[ReactComponentStackDataKey] = componentStack;
        }

        context.event.data[KnownEventDataKeys.Error] = result;
      }
    }

    return Promise.resolve();
  }

  public parse(exception: Error): ErrorInfo {
    const stackTrace = this.parseStackTrace(exception.stack);
    if (stackTrace[0]) {
      stackTrace[0].is_signature_target = true;
    }

    const error: ErrorInfo = {
      type: exception.name || "Error",
      message: exception.message,
      stack_trace: stackTrace
    };
    if (stackTrace[0]) {
      error.target_method = stackTrace[0];
    }

    return error;
  }

  private parseStackTrace(stack: string | undefined): StackFrameInfo[] {
    if (!stack) {
      return [];
    }

    const frames: StackFrameInfo[] = [];
    const lines = stack.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
    for (const line of lines) {
      const frame = this.parseStackFrame(line.trim());
      if (frame) {
        frames.push(frame);
      }
    }

    return frames;
  }

  private parseStackFrame(line: string): StackFrameInfo | null {
    if (!line) {
      return null;
    }

    if (line.startsWith("at ")) {
      const frame = line.slice(3).trim();
      const reactNativeMarker = "() in ";
      const reactNativeMarkerIndex = frame.indexOf(reactNativeMarker);
      if (reactNativeMarkerIndex > 0) {
        return this.createStackFrame(frame.slice(0, reactNativeMarkerIndex), frame.slice(reactNativeMarkerIndex + reactNativeMarker.length));
      }

      if (frame.endsWith(")")) {
        const locationStartIndex = frame.lastIndexOf(" (");
        if (locationStartIndex > 0) {
          return this.createStackFrame(frame.slice(0, locationStartIndex), frame.slice(locationStartIndex + 2, -1));
        }
      }

      return this.createStackFrame("<anonymous>", frame);
    }

    const hermesLocationIndex = line.indexOf("@");
    if (hermesLocationIndex >= 0) {
      return this.createStackFrame(line.slice(0, hermesLocationIndex) || "<anonymous>", line.slice(hermesLocationIndex + 1));
    }

    return null;
  }

  private createStackFrame(name: string, location: string): StackFrameInfo {
    const parsedLocation = this.parseLocation(location);
    return {
      name: this.normalizeFrameName(name),
      parameters: [],
      file_name: parsedLocation.fileName,
      line_number: parsedLocation.lineNumber,
      column: parsedLocation.column,
      data: {
        is_native: parsedLocation.isNative
      }
    };
  }

  private parseLocation(location: string): ParsedLocation {
    let trimmedLocation = location.trim();
    if (trimmedLocation === "native" || trimmedLocation === "<anonymous>") {
      return {
        fileName: trimmedLocation,
        lineNumber: 0,
        column: 0,
        isNative: true
      };
    }

    if (trimmedLocation.startsWith("address at ")) {
      trimmedLocation = trimmedLocation.slice("address at ".length);
    }

    const reactNativeLocation = this.tryParseReactNativeLocation(trimmedLocation);
    if (reactNativeLocation) {
      return reactNativeLocation;
    }

    const lineAndColumn = this.tryParseDelimitedLocation(trimmedLocation, true);
    if (lineAndColumn) {
      return lineAndColumn;
    }

    const lineOnly = this.tryParseDelimitedLocation(trimmedLocation, false);
    if (lineOnly) {
      return lineOnly;
    }

    return {
      fileName: trimmedLocation,
      lineNumber: 0,
      column: 0,
      isNative: false
    };
  }

  private tryParseReactNativeLocation(location: string): ParsedLocation | null {
    const columnMarker = ":col ";
    const lineMarker = ":line ";
    const columnMarkerIndex = location.lastIndexOf(columnMarker);
    if (columnMarkerIndex <= 0) {
      return null;
    }

    const lineMarkerIndex = location.lastIndexOf(lineMarker, columnMarkerIndex);
    if (lineMarkerIndex <= 0) {
      return null;
    }

    const lineNumber = this.tryParseNonNegativeInteger(location.slice(lineMarkerIndex + lineMarker.length, columnMarkerIndex));
    const column = this.tryParseNonNegativeInteger(location.slice(columnMarkerIndex + columnMarker.length));
    if (lineNumber === null || column === null) {
      return null;
    }

    return {
      fileName: location.slice(0, lineMarkerIndex),
      lineNumber,
      column,
      isNative: false
    };
  }

  private tryParseDelimitedLocation(location: string, hasColumn: boolean): ParsedLocation | null {
    const lastDelimiterIndex = location.lastIndexOf(":");
    if (lastDelimiterIndex <= 0) {
      return null;
    }

    const lastNumber = this.tryParseNonNegativeInteger(location.slice(lastDelimiterIndex + 1));
    if (lastNumber === null) {
      return null;
    }

    if (!hasColumn) {
      return {
        fileName: location.slice(0, lastDelimiterIndex),
        lineNumber: lastNumber,
        column: 0,
        isNative: false
      };
    }

    const lineDelimiterIndex = location.lastIndexOf(":", lastDelimiterIndex - 1);
    if (lineDelimiterIndex <= 0) {
      return null;
    }

    const lineNumber = this.tryParseNonNegativeInteger(location.slice(lineDelimiterIndex + 1, lastDelimiterIndex));
    if (lineNumber === null) {
      return null;
    }

    return {
      fileName: location.slice(0, lineDelimiterIndex),
      lineNumber,
      column: lastNumber,
      isNative: false
    };
  }

  private tryParseNonNegativeInteger(value: string): number | null {
    if (!value) {
      return null;
    }

    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      if (charCode < 48 || charCode > 57) {
        return null;
      }
    }

    return Number(value);
  }

  private normalizeFrameName(name: string): string {
    const trimmed = name.trim();
    const trimmedName = trimmed.endsWith("()") ? trimmed.slice(0, -2) : trimmed;
    if (!trimmedName || trimmedName === "?") {
      return "<anonymous>";
    }

    const syntheticHermesPrefix = "?anon_";
    if (trimmedName.startsWith(syntheticHermesPrefix)) {
      let suffixIndex = syntheticHermesPrefix.length;
      while (suffixIndex < trimmedName.length) {
        const charCode = trimmedName.charCodeAt(suffixIndex);
        if (charCode < 48 || charCode > 57) {
          break;
        }

        suffixIndex++;
      }

      if (trimmedName[suffixIndex] === "_") {
        const suffix = trimmedName.slice(suffixIndex + 1);
        return suffix || "<anonymous>";
      }

      return "<anonymous>";
    }

    return trimmedName;
  }
}
