import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority:number = 10;
  public name:string = 'ConfigurationDefaultsPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    var defaultTags = context.client.config.defaultTags || [];
    for (var index = 0; index < defaultTags.length; index++) {
      var tag = defaultTags[index];
      if (!!tag && context.event.tags.indexOf(tag) < 0) {
        context.event.tags.push(tag)
      }
    }

    var defaultData = context.client.config.defaultData || {};
    for (var key in defaultData) {
      if (!!defaultData[key]) {
        context.event.data[key] = defaultData[key];
      }
    }

    if (next) {
      next();
    }
  }
}
