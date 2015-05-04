import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IEnvironmentInfo } from '../../models/IEnvironmentInfo';

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority:number = 70;
  public name:string = 'EnvironmentInfoPlugin';

  run(context:EventPluginContext):Promise<any> {
    if (!!context.event.data && !!context.event.data['@environment'] || !context.client.config.environmentInfoCollector) {
      return Promise.resolve();
    }

    if (!context.event.data) {
      context.event.data = {};
    }

    var ei = context.client.config.environmentInfoCollector.getEnvironmentInfo(context);
    if (ei) {
      context.event.data['@environment'] = ei;
    }

    return Promise.resolve();
  }
}
