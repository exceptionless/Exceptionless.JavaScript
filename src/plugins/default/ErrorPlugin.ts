import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class ErrorPlugin implements IEventPlugin {
  public priority:number = 30;
  public name:string = 'ErrorPlugin';

  run(context:EventPluginContext): Promise<any> {
    var exception = context.contextData.getException();
    if (exception == null) {
      return Promise.resolve();
    }

    if (!context.event.data) {
      context.event.data = {};
    }

    context.event.type = 'error';
    if (!!context.event.data['@error']) {
      return Promise.resolve();
    }

    var parser = context.client.config.errorParser;
    if (!parser) {
      context.cancel = true;
      return Promise.reject(new Error('No error parser was defined. This exception will be discarded.'))
    }

    return parser.parse(context, exception);
  }
}
