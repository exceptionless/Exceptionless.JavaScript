import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority:number = 10;
  public name:string = 'ConfigurationDefaultsPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    let defaultTags:string[] = context.client.config.defaultTags || [];
    for (let index = 0; index < defaultTags.length; index++) {
      let tag = defaultTags[index];
      if (!!tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag);
      }
    }

    let defaultData:Object = context.client.config.defaultData || {};
    for (let key in defaultData) {
      if (!!defaultData[key]) {
        context.event.data[key] = defaultData[key];
      }
    }

    next && next();
  }
}
