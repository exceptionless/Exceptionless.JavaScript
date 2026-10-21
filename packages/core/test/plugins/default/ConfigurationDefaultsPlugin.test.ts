import { describe, expect, test } from "vitest";

import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import { Event } from "../../../src/models/Event.js";
import { ConfigurationDefaultsPlugin } from "../../../src/plugins/default/ConfigurationDefaultsPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { EventContext } from "../../../src/models/EventContext.js";

describe("ConfigurationDefaultsPlugin", () => {
  test("should apply deployment defaults to all event types and preserve overrides and runtime metadata", async () => {
    const client = new ExceptionlessClient();
    client.config.setEnvironment(" Production ");
    const plugin = new ConfigurationDefaultsPlugin();
    for (const type of ["error", "log", "usage", "session"]) {
      const event: Event = {
        type,
        data: {
          "@environment": {
            machine_name: "worker-1"
          }
        }
      };
      await plugin.run(new EventPluginContext(client, event, new EventContext()));
      expect(event.environment).toBe("Production");
      expect(event.data?.["@environment"]?.machine_name).toBe("worker-1");
    }

    const builder = client.createLog("test", "message").setEnvironment(" Staging ");
    await plugin.run(new EventPluginContext(client, builder.target, new EventContext()));
    expect(builder.target.environment).toBe("Staging");
    expect(JSON.parse(JSON.stringify(builder.target)).environment).toBe("Staging");
  });

  test.each(["", " ", "x".repeat(65), "prod\ninvalid"])("should keep invalid override %j unspecified", async (environment) => {
    const client = new ExceptionlessClient();
    client.config.environment = "production";
    const builder = client.createLog("test", "message").setEnvironment(environment);
    await new ConfigurationDefaultsPlugin().run(new EventPluginContext(client, builder.target, new EventContext()));
    expect(builder.target.environment).toBeUndefined();
  });

  test.each([null, undefined])("should apply the default when the override is cleared with %j", async (environment) => {
    const client = new ExceptionlessClient();
    client.config.environment = "production";
    const builder = client.createLog("test", "message").setEnvironment("staging").setEnvironment(environment);
    await new ConfigurationDefaultsPlugin().run(new EventPluginContext(client, builder.target, new EventContext()));
    expect(builder.target.environment).toBe("production");
  });

  test("should trim surrounding control whitespace from an override", async () => {
    const client = new ExceptionlessClient();
    client.config.environment = "production";
    const builder = client.createLog("test", "message").setEnvironment("\tStaging\n");
    await new ConfigurationDefaultsPlugin().run(new EventPluginContext(client, builder.target, new EventContext()));
    expect(builder.target.environment).toBe("Staging");
  });

  test("should omit an unspecified environment from the serialized event", async () => {
    const client = new ExceptionlessClient();
    const builder = client.createLog("test", "message");
    await new ConfigurationDefaultsPlugin().run(new EventPluginContext(client, builder.target, new EventContext()));
    const serialized = JSON.parse(JSON.stringify(builder.target)) as Record<string, unknown>;
    expect(Object.keys(serialized)).not.toContain("environment");
  });

  describe("should add default", () => {
    const userDataKey: string = "user";
    const user = {
      id: 1,
      name: "Blake",
      password: "123456",
      passwordResetToken: "a reset token",
      myPassword: "123456",
      myPasswordValue: "123456",
      customValue: "Password",
      value: {
        Password: "123456"
      }
    };

    const defaultTags: string[] = ["tag1", "tag2"];

    const run = async (dataExclusions?: string[] | undefined): Promise<Event> => {
      const client = new ExceptionlessClient();
      client.config.defaultTags.push(...defaultTags);
      client.config.defaultData[userDataKey] = user;

      if (dataExclusions) {
        client.config.addDataExclusions(...dataExclusions);
      }

      const ev: Event = {
        type: "log",
        source: "test",
        data: {}
      };

      const context = new EventPluginContext(client, ev, new EventContext());
      const plugin = new ConfigurationDefaultsPlugin();
      await plugin.run(context);

      return context.event;
    };

    test("tags", async () => {
      const ev = await run();
      expect(ev.tags).toStrictEqual(defaultTags);
    });

    test("user", async () => {
      const ev = await run();
      expect(ev.data).toBeDefined();
      expect(ev.data && ev.data[userDataKey]).toStrictEqual(user);
    });

    test("pruned user", async () => {
      const ev = await run(["*password*"]);
      expect(ev.data).toBeDefined();

      const expected = {
        id: 1,
        name: "Blake",
        customValue: "Password",
        value: {}
      };
      expect(ev.data && ev.data[userDataKey]).toStrictEqual(expected);
    });
  });
});
