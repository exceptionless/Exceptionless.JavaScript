import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority:number = 50;
  public name:string = 'DuplicateCheckerPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    // TODO: Implement
    if (next) {
      next();
    }
  }
}
