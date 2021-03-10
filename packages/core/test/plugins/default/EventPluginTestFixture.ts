import { ContextData } from "../../../src/plugins/ContextData.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { IErrorParser } from "../../../src/services/IErrorParser.js";
import { Event } from "../../../src/models/Event.js";

// TODO: This should use the real object instances and inject the error parser.
export function createFixture(): { contextData: ContextData, context: EventPluginContext, client: any, event: Event } {
  const errorParser: IErrorParser = {
    parse: (c: EventPluginContext, exception: Error) => Promise.resolve({
      type: exception.name,
      message: exception.message,
      stack_trace: (exception as any).testStack || null
    })
  };
  const client: any = {
    config: {
      dataExclusions: [],
      errorParser,
      log: {
        info: () => { }
      }
    }
  };
  const event: Event = {
    data: {}
  };
  const contextData: ContextData = new ContextData();
  const context: EventPluginContext = new EventPluginContext(client, event, contextData);

  return {
    contextData,
    context,
    client,
    event
  };
}
