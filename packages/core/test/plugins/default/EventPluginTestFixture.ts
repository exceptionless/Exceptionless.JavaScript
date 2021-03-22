import { ContextData } from "../../../src/plugins/ContextData.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { IErrorParser } from "../../../src/services/IErrorParser.js";
import { Event } from "../../../src/models/Event.js";
import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";

export function createFixture(): { contextData: ContextData, context: EventPluginContext, client: any, event: Event } {
  const errorParser: IErrorParser = {
    parse: (c: EventPluginContext, exception: Error) => Promise.resolve({
      type: exception.name,
      message: exception.message,
      stack_trace: null
    })
  };
  const client: ExceptionlessClient = new ExceptionlessClient();
  client.config.services.errorParser = errorParser;

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
