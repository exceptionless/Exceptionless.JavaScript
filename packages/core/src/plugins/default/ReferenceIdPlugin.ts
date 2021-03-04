import { guid } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class ReferenceIdPlugin implements IEventPlugin {
  public priority: number = 20;
  public name: string = "ReferenceIdPlugin";

  public run(context: EventPluginContext): Promise<void> {
    if (!context.event.reference_id && context.event.type === "error") {
      // PERF: Optimize identifier creation.
      context.event.reference_id = guid().replace("-", "").substring(0, 10);
    }

    return Promise.resolve();
  }
}
