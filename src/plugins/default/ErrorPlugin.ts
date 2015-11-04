import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ErrorPlugin implements IEventPlugin {
  public priority: number = 30;
  public name: string = 'ErrorPlugin';
  public ignoredProperties: string[] = [
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

  public run(context: EventPluginContext, next?: () => void): void {
    const ERROR_KEY: string = '@error'; // optimization for minifier.
    const EXTRA_PROPERTIES_KEY: string = '@ext';

    let exception = context.contextData.getException();
    if (!!exception) {
      context.event.type = 'error';

      if (!context.event.data[ERROR_KEY]) {
        let parser = context.client.config.errorParser;
        if (!parser) {
          throw new Error('No error parser was defined.');
        }

        let result = parser.parse(context, exception);
        if (!!result) {
          let additionalData = this.getAdditionalData(exception);
          if (!!additionalData) {
            if (!result.data) {
              result.data = {};
            }
            result.data[EXTRA_PROPERTIES_KEY] = additionalData;
          }

          context.event.data[ERROR_KEY] = result;
        }
      }
    }

    next && next();
  }

  private getAdditionalData(exception: Error): { [key: string]: any } {
    let additionalData = {};
    for (var key in exception) {
      if (this.ignoredProperties.indexOf(key) >= 0) {
        continue;
      }
      let value = exception[key];
      if (typeof value !== 'function') {
        additionalData[key] = value;
      }
    }

    return Object.getOwnPropertyNames(additionalData).length
      ? additionalData
      : null;
  }
}
