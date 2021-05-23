import { KnownEventDataKeys } from "../../models/Event.js";
import { stringify, isEmpty } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ErrorPlugin implements IEventPlugin {
  public priority = 30;
  public name = "ErrorPlugin";

  public async run(context: EventPluginContext): Promise<void> {
    const IGNORED_ERROR_PROPERTIES: string[] = [
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

    const exception = context.eventContext.getException();
    if (exception) {
      context.event.type = "error";

      if (!context.event.data[KnownEventDataKeys.Error]) {
        const config = context.client.config;
        const parser = config.services.errorParser;
        if (!parser) {
          throw new Error("No error parser was defined.");
        }

        const result = await parser.parse(context, exception);
        if (result) {
          const additionalData = JSON.parse(stringify(exception, config.dataExclusions.concat(IGNORED_ERROR_PROPERTIES)));
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
}
