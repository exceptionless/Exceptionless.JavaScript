import { EventPluginContext, IEventPlugin } from "@exceptionless/core";

export class BrowserIgnoreExtensionErrorsPlugin implements IEventPlugin {
  public priority = 15;
  public name = "BrowserIgnoreExtensionErrorsPlugin";

  public async run(context: EventPluginContext): Promise<void> {
    const exception = context.eventContext.getException();
    if (exception?.stack && exception.stack.includes("-extension://")) {
      // Handles all extensions like chrome-extension://, moz-extension://, ms-browser-extension://, safari-extension://
      context.log.info("Ignoring event with error stack containing browser extension");
      context.cancelled = true;
    }

    return Promise.resolve();
  }
}
