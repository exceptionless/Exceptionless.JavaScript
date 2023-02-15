import { describe, test } from "@jest/globals";
import { expect } from "expect";

import { ExceptionlessClient } from "../src/ExceptionlessClient.js";
import { KnownEventDataKeys } from "../src/models/Event.js";
import { ReferenceIdPlugin } from "../src/plugins/default/ReferenceIdPlugin.js";

describe("ExceptionlessClient", () => {
  test("should use event reference ids", async () => {
    const error = createException();

    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    const { lastReferenceIdManager } = client.config.services;
    expect(lastReferenceIdManager.getLast()).toBeNull();

    let context = await client.submitException(error);
    expect(context.event.reference_id).toBeUndefined();
    expect(lastReferenceIdManager.getLast()).toBeNull();

    const numberOfPlugins = client.config.plugins.length;
    client.config.addPlugin(new ReferenceIdPlugin());
    expect(client.config.plugins.length).toBe(numberOfPlugins + 1);

    context = await client.submitException(error);
    expect(context.event.reference_id).not.toBeUndefined();
    const lastReference = lastReferenceIdManager.getLast();
    expect(context.event.reference_id).toBe(lastReference);

    context = await client.submitException(error);
    expect(context.event.reference_id).not.toBeUndefined();
    expect(context.event.reference_id).not.toBe(lastReference);
    expect(context.event.reference_id).toBe(lastReferenceIdManager.getLast());
  });

  test("should accept undefined source", () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    const builder = client.createLog(undefined, "Unit Test message", "Trace");

    expect(builder.target.source).toBeUndefined();
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data?.[KnownEventDataKeys.Level]).toBe("Trace");
  });

  test("should accept source and message", () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    const builder = client.createLog("ExceptionlessClient", "Unit Test message");

    expect(builder.target.source).toBe("ExceptionlessClient");
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data).toBeUndefined();
  });

  test("should accept source and message and level", () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    const builder = client.createLog("source", "Unit Test message", "Info");

    expect(builder.target.source).toBe("source");
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data?.[KnownEventDataKeys.Level]).toBe("Info");
  });

  test("should allow construction via a configuration object", () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    client.config.serverUrl = "http://localhost:5000";

    expect(client.config.apiKey).toBe("UNIT_TEST_API_KEY");
    expect(client.config.serverUrl).toBe("http://localhost:5000");
  });

  test("should allow construction via a constructor", async () => {
    const client = new ExceptionlessClient();

    await client.startup(c => {
      c.apiKey = "UNIT_TEST_API_KEY";
      c.serverUrl = "http://localhost:5000";
      c.updateSettingsWhenIdleInterval = -1;
    });

    await client.suspend();
    expect(client.config.apiKey).toBe("UNIT_TEST_API_KEY");
    expect(client.config.serverUrl).toBe("http://localhost:5000");
  });


  function createException(): ReferenceError {
    function throwError() {
      throw new ReferenceError("This is a test");
    }
    try {
      throwError();
    } catch (e) {
      return e as ReferenceError;
    }

    return new ReferenceError("No Stack Trace")
  }
});
