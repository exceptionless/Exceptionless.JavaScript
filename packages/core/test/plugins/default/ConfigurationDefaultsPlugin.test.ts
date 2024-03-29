import { describe, test } from "@jest/globals";
import { expect } from "expect";

import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import { Event } from "../../../src/models/Event.js";
import { ConfigurationDefaultsPlugin } from "../../../src/plugins/default/ConfigurationDefaultsPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { EventContext } from "../../../src/models/EventContext.js";

describe("ConfigurationDefaultsPlugin", () => {
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

      const ev: Event = <Event>{ type: "log", source: "test", data: {} };

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

      const expected = { id: 1, name: "Blake", customValue: "Password", value: {} };
      expect(ev.data && ev.data[userDataKey]).toStrictEqual(expected);
    });
  });
});
