import { KnownEventDataKeys } from "../../models/Event.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class SubmissionMethodPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = "SubmissionMethodPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const submissionMethod: string = context.contextData.getSubmissionMethod();
    if (submissionMethod) {
      context.event.data[KnownEventDataKeys.SubmissionMethod] = submissionMethod;
    }

    return Promise.resolve();
  }
}
