import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";
import { isEmpty, stringify } from "../../Utils.js";
import { SimpleError } from "../../models/data/ErrorInfo.js";
import { KnownEventDataKeys } from "../../models/Event.js";

export const IgnoredErrorProperties: string[] = [
  "arguments",
  "column",
  "columnNumber",
  "description",
  "fileName",
  "message",
  "name",
  "number",
  "line",
  "lineNumber",
  "opera#sourceloc",
  "sourceId",
  "sourceURL",
  "stack",
  "stackArray",
  "stacktrace"
];

export class SimpleErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "SimpleErrorPlugin";

  public async run(context: EventPluginContext): Promise<void> {
    const exception = context.eventContext.getException();
    if (exception) {
      if (!context.event.type) {
        context.event.type = "error";
      }

      if (context.event.data && !context.event.data[KnownEventDataKeys.SimpleError]) {
        const error = <SimpleError>{
          type: exception.name || "Error",
          message: exception.message,
          stack_trace: exception.stack,
          data: {}
        };

        const exclusions = context.client.config.dataExclusions.concat(IgnoredErrorProperties);
        const additionalData = stringify(exception, exclusions);
        if (!isEmpty(additionalData)) {
          (error.data as Record<string, unknown>)["@ext"] = JSON.parse(additionalData);
        }

        context.event.data[KnownEventDataKeys.SimpleError] = error;
      }
    }

    return Promise.resolve();
  }
}
