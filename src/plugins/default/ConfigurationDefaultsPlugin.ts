import { Utils } from '../../Utils';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority: number = 10;
  public name: string = 'ConfigurationDefaultsPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const config = context.client.config;
    const defaultTags: string[] = config.defaultTags || [];
    for (let index = 0; index < defaultTags.length; index++) {
      const tag = defaultTags[index];
      if (!!tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag);
      }
    }

    const defaultData: object = config.defaultData || {};
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
