import { IEnvironmentInfo } from '../../models/IEnvironmentInfo.js';
import { EventPluginContext } from '../EventPluginContext.js';
import { IEventPlugin } from '../IEventPlugin.js';

export class EnvironmentInfoPlugin implements IEventPlugin {
  public priority: number = 80;
  public name: string = 'EnvironmentInfoPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const ENVIRONMENT_KEY: string = '@environment'; // optimization for minifier.

    const collector = context.client.config.environmentInfoCollector;
    if (!context.event.data[ENVIRONMENT_KEY] && collector) {
      const environmentInfo: IEnvironmentInfo = collector.getEnvironmentInfo(context);
      if (environmentInfo) {
        context.event.data[ENVIRONMENT_KEY] = environmentInfo;
      }
    }

    next && next();
  }
}
