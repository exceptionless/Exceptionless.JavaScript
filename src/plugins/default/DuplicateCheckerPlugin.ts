import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority:number = 50;
  public name:string = 'DuplicateCheckerPlugin';

  run(context:EventPluginContext):Promise<any> {
    // TODO: Implement
    return Promise.resolve();
  }
}
