import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ConfigurationDefaultsPlugin implements IEventPlugin {
  public priority:number = 10;
  public name:string = 'ConfigurationDefaultsPlugin';

  run(context:EventPluginContext): Promise<any> {
    if (!!context.client.config.defaultTags) {
      if (!context.event.tags) {
        context.event.tags = [];
      }

      for (var index = 0; index < context.client.config.defaultTags.length; index++) {
        var tag = context.client.config.defaultTags[index];
        if (tag && context.client.config.defaultTags.indexOf(tag) < 0) {
          context.event.tags.push(tag)
        }
      }
    }

    if (!!context.client.config.defaultData) {
      if (!context.event.data) {
        context.event.data = {};
      }

      for (var key in context.client.config.defaultData) {
        if (!!context.client.config.defaultData[key]) {
          context.event.data[key] = context.client.config.defaultData[key];
        }
      }
    }

    return Promise.resolve();
  }
}
