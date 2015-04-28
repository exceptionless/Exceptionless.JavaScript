import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class ReferenceIdPlugin implements IEventPlugin {
  public priority:number = 20;
  public name:string = 'ReferenceIdPlugin';

  run(context:EventPluginContext): Promise<any> {
    if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
      context.event.reference_id = Utils.guid().replace('-', '').substring(0, 10);
    }

    return Promise.resolve();
  }
}
