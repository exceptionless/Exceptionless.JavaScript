import { IEvent } from '../../models/IEvent';
import { IErrorParser } from '../../services/IErrorParser';
import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';

// TODO: This should use the real object instances and inject the error parser.
export function createFixture() {
  let contextData: ContextData;
  let context: EventPluginContext;
  let errorParser: IErrorParser;
  let client: any;
  let event: IEvent;

  errorParser = {
    parse: (c: EventPluginContext, exception: Error) => ({
      type: exception.name,
      message: exception.message,
      stack_trace: ( exception as any).testStack || null
    })
  };
  client = {
    config: {
      dataExclusions: [],
      errorParser,
      log: {
        info: () => { }
      }
    }
  };
  event = {
    data: {}
  };
  contextData = new ContextData();
  context = new EventPluginContext(client, event, contextData);

  return {
    contextData,
    context,
    client,
    event
  };
}
