import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { IErrorParser } from "../../../src/services/IErrorParser.js";
import { Event } from "../../../src/models/Event.js";
import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";

export function createFixture(): EventPluginContext {
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

  return new EventPluginContext(client, event);
}
