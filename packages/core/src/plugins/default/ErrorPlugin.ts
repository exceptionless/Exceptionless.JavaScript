import { Utils } from '../../Utils.js';
import { EventPluginContext } from '../EventPluginContext.js';
import { IEventPlugin } from '../IEventPlugin.js';

export class ErrorPlugin implements IEventPlugin {
  public priority: number = 30;
  public name: string = 'ErrorPlugin';

  public async run(context: EventPluginContext): Promise<void> {
    const ERROR_KEY: string = '@error'; // optimization for minifier.
    const ignoredProperties: string[] = [
      'arguments',
      'column',
      'columnNumber',
      'description',
      'fileName',
      'message',
      'name',
      'number',
      'line',
      'lineNumber',
      'opera#sourceloc',
      'sourceId',
      'sourceURL',
      'stack',
      'stackArray',
      'stacktrace'
    ];

    const exception = context.contextData.getException();
    if (exception) {
      context.event.type = 'error';

      if (!context.event.data[ERROR_KEY]) {
        const config = context.client.config;
        const parser = config.errorParser;
        if (!parser) {
          throw new Error('No error parser was defined.');
        }

        const result = await parser.parse(context, exception);
        if (result) {
          const additionalData = JSON.parse(Utils.stringify(exception, config.dataExclusions.concat(ignoredProperties)));
          if (!Utils.isEmpty(additionalData)) {
            if (!result.data) {
              result.data = {};
            }
            result.data['@ext'] = additionalData;
          }

          context.event.data[ERROR_KEY] = result;
        }
      }
    }
  }
}
