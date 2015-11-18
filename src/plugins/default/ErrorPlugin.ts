import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { Utils } from '../../Utils';

export class ErrorPlugin implements IEventPlugin {
  public priority: number = 30;
  public name: string = 'ErrorPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const ERROR_KEY: string = '@error'; // optimization for minifier.
    let ignoredProperties: string[] = [
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

    let exception = context.contextData.getException();
    if (!!exception) {
      context.event.type = 'error';

      if (!context.event.data[ERROR_KEY]) {
        let config = context.client.config;
        let parser = config.errorParser;
        if (!parser) {
          throw new Error('No error parser was defined.');
        }

        let result = parser.parse(context, exception);
        if (!!result) {
          let additionalData = JSON.parse(Utils.stringify(exception, config.dataExclusions.concat(ignoredProperties)));
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

    next && next();
  }
}
