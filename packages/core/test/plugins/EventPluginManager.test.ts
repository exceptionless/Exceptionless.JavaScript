import { EventContext } from "../../src/models/EventContext.js";
import { ExceptionlessClient } from "../../src/ExceptionlessClient.js";
import { EventPluginContext } from "../../src/plugins/EventPluginContext.js";
import { EventPluginManager } from "../../src/plugins/EventPluginManager.js";
import { delay } from "../helpers.js";

describe("EventPluginManager", () => {
  test("should add items to the event.", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    const context = new EventPluginContext(client, {}, new EventContext());
    expect(context.event.source).toBeUndefined();
    expect(context.event.geo).toBeUndefined();

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin("1", 1, async (ctx: EventPluginContext) => {
      await delay(25);
      ctx.event.source = "plugin 1";
    });

    client.config.addPlugin("2", 2, (ctx: EventPluginContext) => {
      ctx.event.geo = "43.5775,88.4472";
      return Promise.resolve();
    });

    await EventPluginManager.run(context);
    expect(context.cancelled).toBe(false);
    expect(context.event.source).toBe("plugin 1");
    expect(context.event.geo).toBe("43.5775,88.4472");
  });

  test("setting cancel should stop plugin execution.", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";

    const context = new EventPluginContext(client, {}, new EventContext());
    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin("1", 1, (ctx: EventPluginContext) => {
      ctx.cancelled = true;
      return Promise.resolve();
    });

    client.config.addPlugin("2", 2, () => {
      throw new Error("Plugin should not be called due to cancellation");
    });

    await EventPluginManager.run(context);
    expect(context.cancelled).toBe(true);
  });

  test("throwing error should stop plugin execution.", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    const context = new EventPluginContext(client, {}, new EventContext());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin("1", 1, () => {
      throw new Error("Random Error");
    });

    client.config.addPlugin("2", 2, () => {
      throw new Error("Plugin should not be called due to cancellation");
    });

    await EventPluginManager.run(context);
    expect(context.cancelled).toBe(true);
  });

  test("should cancel via timeout.", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    const context = new EventPluginContext(client, {}, new EventContext());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin("1", 1, async () => {
      await delay(25);
    });

    client.config.addPlugin("2", 2, () => {
      throw new Error("Plugin should not be called due to cancellation");
    });

    await EventPluginManager.run(context);
    expect(context.cancelled).toBe(true);
  });

  test("should ensure config plugins are not wrapped.", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    const context = new EventPluginContext(client, {}, new EventContext());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin("1", 1, () => {
      return Promise.resolve();
    });

    expect(client.config.plugins[0].name).toBe("1");
    expect(client.config.plugins.length).toBe(1);

    await EventPluginManager.run(context);
    expect(client.config.plugins[0].name).toBe("1");
    expect(client.config.plugins.length).toBe(1);
  });
});
