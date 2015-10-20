import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IEnvironmentInfo } from '../../models/IEnvironmentInfo';

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority:number = 70;
  public name:string = 'EnvironmentInfoPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    const ENVIRONMENT_KEY:string = '@environment'; // optimization for minifier.

    let collector = context.client.config.environmentInfoCollector;
    if (!context.event.data[ENVIRONMENT_KEY] && collector) {
      let environmentInfo:IEnvironmentInfo = collector.getEnvironmentInfo(context);
      if (!!environmentInfo) {
        context.event.data[ENVIRONMENT_KEY] = environmentInfo;
      }
    }

    next && next();
  }
}
