import { describe, test } from "@jest/globals";
import { expect } from "expect";

import { EventContext, EventPluginContext, ExceptionlessClient } from "@exceptionless/core";

import { BrowserIgnoreExtensionErrorsPlugin } from "../../src/plugins/BrowserIgnoreExtensionErrorsPlugin.js";

describe("BrowserIgnoreExtensionErrorsPlugin", () => {
  let client: ExceptionlessClient;
  let plugin: BrowserIgnoreExtensionErrorsPlugin;

  beforeEach(() => {
    client = new ExceptionlessClient();
    plugin = new BrowserIgnoreExtensionErrorsPlugin();
  });

  const run = async (stackTrace?: string | undefined): Promise<EventPluginContext> => {
    const error = new Error("Test");
    if (stackTrace) {
      error.stack = stackTrace;
    }

    const eventContext = new EventContext();
    eventContext.setException(error);

    const context = new EventPluginContext(client, { type: "error" }, eventContext);

    await plugin.run(context);
    return context;
  };

  test("should not cancel empty stack trace", async () => {
    const context = await run();
    expect(context.cancelled).toBe(false);
  });

  test("should not cancel normal stack trace", async () => {
    const context = await run("at t() in https://test/Content/js/Exceptionless/exceptionless.min.js:line 1:col 260");
    expect(context.cancelled).toBe(false);
  });

  test("should cancel browser extension stack trace", async () => {
    const context = await run("at Object.initialize() in chrome-extension://bmagokdooijbeehmkpknfglimnifench/firebug-lite.js:line 6289:col 29");
    expect(context.cancelled).toBe(true);
  });
});
