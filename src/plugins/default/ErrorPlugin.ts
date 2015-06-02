import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ErrorPlugin implements IEventPlugin {
  public priority:number = 30;
  public name:string = 'ErrorPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    const ERROR_KEY:string = '@error'; // optimization for minifier.

    var exception = context.contextData.getException();
    if (!!exception) {
      context.event.type = 'error';

      if (!context.event.data[ERROR_KEY]) {
        var parser = context.client.config.errorParser;
        if (!parser) {
          throw new Error('No error parser was defined.');
        }

        var result = parser.parse(context, exception);
        if (!!result) {
          context.event.data[ERROR_KEY] = result;
        }
      }
    }

    next && next();
  }
}
