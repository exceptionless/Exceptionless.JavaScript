import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class SubmissionMethodPlugin implements IEventPlugin {
  public priority = 100;
  public name = "SubmissionMethodPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const submissionMethod = context.eventContext.getSubmissionMethod();
    if (submissionMethod && context.event.data) {
      context.event.data[KnownEventDataKeys.SubmissionMethod] = submissionMethod;
    }

    return Promise.resolve();
  }
}
