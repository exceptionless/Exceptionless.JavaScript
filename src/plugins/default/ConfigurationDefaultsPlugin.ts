import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority: number = 10;
  public name: string = 'ConfigurationDefaultsPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    let config = context.client.config;
    let defaultTags: string[] = config.defaultTags || [];
    for (let index = 0; index < defaultTags.length; index++) {
      let tag = defaultTags[index];
      if (!!tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag);
      }
    }

    let defaultData: Object = config.defaultData || {};
    for (let key in defaultData) {
      if (!!defaultData[key]) {
        let result = JSON.parse(Utils.stringify(defaultData[key], config.dataExclusions));
        if (!Utils.isEmpty(result)) {
          context.event.data[key] = result;
        }
      }
    }

    next && next();
  }
}
