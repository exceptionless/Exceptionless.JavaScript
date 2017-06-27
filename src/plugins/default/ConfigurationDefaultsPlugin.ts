import { Utils } from '../../Utils';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority: number = 10;
  public name: string = 'ConfigurationDefaultsPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const config = context.client.config;
    const defaultTags: string[] = config.defaultTags || [];
    for (const tag of defaultTags) {
      if (!!tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag);
      }
    }

    // tslint:disable-next-line:ban-types
    const defaultData: Object = config.defaultData || {};
    for (const key in defaultData) {
      if (!!defaultData[key]) {
        const result = JSON.parse(Utils.stringify(defaultData[key], config.dataExclusions));
        if (!Utils.isEmpty(result)) {
          context.event.data[key] = result;
        }
      }
    }

    next && next();
  }
}
