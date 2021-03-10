

import { Configuration } from "../src/configuration/Configuration.js";
import { ExceptionlessClient } from "../src/ExceptionlessClient.js";
import { KnownEventDataKeys } from "../src/models/Event.js";
import { Exceptionless } from "../src/index.js";

describe("ExceptionlessClient", () => {
  beforeEach(() => {
    Configuration.defaults.updateSettingsWhenIdleInterval = -1;
  });

  test("should use event reference ids", async () => {
    const client = new ExceptionlessClient();
    await client.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000"
    });

    expect(client.config.lastReferenceIdManager.getLast()).toBeNull();

    const error = createException();
    await client.submitException(error);
    expect(client.config.lastReferenceIdManager.getLast()).toBeNull();

    const numberOfPlugins = client.config.plugins.length;
    client.config.useReferenceIds();
    expect(client.config.plugins.length).toBe(numberOfPlugins + 1);

    const context = await client.submitException(error);
    if (!context.cancelled) {
      expect(client.config.lastReferenceIdManager.getLast()).not.toBeNull();
    } else {
      expect(client.config.lastReferenceIdManager.getLast()).toBeNull();
    }
  });

  test("should accept null source", async () => {
    const client = new ExceptionlessClient();
    await client.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000"
    });

    const builder = client.createLog(null, "Unit Test message", "Trace");

    expect(builder.target.source).toBeUndefined();
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data[KnownEventDataKeys.Level]).toBe("Trace");
  });

  test("should accept source and message", async () => {
    const client = new ExceptionlessClient();
    await client.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000"
    });

    const builder = client.createLog("ExceptionlessClient", "Unit Test message");

    expect(builder.target.source).toBe("ExceptionlessClient");
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data).toBeUndefined();
  });

  test("should accept source and message and level", async () => {
    const client = new ExceptionlessClient();
    await client.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000"
    });
    const builder = client.createLog("source", "Unit Test message", "Info");

    expect(builder.target.source).toBe("source");
    expect(builder.target.message).toBe("Unit Test message");
    expect(builder.target.data[KnownEventDataKeys.Level]).toBe("Info");
  });

  test("should allow construction via a configuration object", async () => {
    const client = new ExceptionlessClient();
    await client.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000"
    });

    expect(client.config.apiKey).toBe("LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw");
    expect(client.config.serverUrl).toBe("http://localhost:5000");
  });

  function createException() {
    function throwError() {
      throw new ReferenceError("This is a test");
    }
    try {
      throwError();
    } catch (e) {
      return e;
    }
  }

  test("can use singleton export", () => {
    Exceptionless.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000",
    });

    expect(Exceptionless.config.apiKey).toBe(
      "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
    );
    expect(Exceptionless.config.serverUrl).toBe("http://localhost:5000");
  });

});
