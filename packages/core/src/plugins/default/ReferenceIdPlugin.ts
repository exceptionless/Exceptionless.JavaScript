import { guid } from "../../Utils.js";
import { EventPluginContext } from '../EventPluginContext.js';
import { IEventPlugin } from '../IEventPlugin.js';

export class ReferenceIdPlugin implements IEventPlugin {
  public priority: number = 20;
  public name: string = 'ReferenceIdPlugin';

  public run(context: EventPluginContext): Promise<void> {
    if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
      context.event.reference_id = guid().replace('-', '').substring(0, 10);
    }

    return Promise.resolve();
  }
}
