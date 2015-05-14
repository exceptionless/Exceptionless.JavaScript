import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IEnvironmentInfo } from '../../models/IEnvironmentInfo';

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority:number = 70;
  public name:string = 'EnvironmentInfoPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    if (!context.event.data['@environment'] && context.client.config.environmentInfoCollector) {
      var ei = context.client.config.environmentInfoCollector.getEnvironmentInfo(context);
      if (!!ei) {
        context.event.data['@environment'] = ei;
      }
    }

    if (next) {
      next();
    }
  }
}
