import { describe, expect, test } from "vitest";

import { BrowserExceptionlessClient } from "../src/BrowserExceptionlessClient.js";

describe("BrowserExceptionlessClient", () => {
  test("should configure documented browser plugins on first startup", async () => {
    const client = new BrowserExceptionlessClient();

    await client.startup((config) => {
      config.apiKey = "UNIT_TEST_API_KEY";
      config.updateSettingsWhenIdleInterval = -1;
    });

    try {
      const pluginNames = client.config.plugins.map((plugin) => plugin.name);

      expect(pluginNames).toContain("BrowserGlobalHandlerPlugin");
      expect(pluginNames).toContain("BrowserIgnoreExtensionErrorsPlugin");
      expect(pluginNames).toContain("BrowserLifeCyclePlugin");
      expect(pluginNames).toContain("BrowserModuleInfoPlugin");
      expect(pluginNames).toContain("BrowserRequestInfoPlugin");
      expect(pluginNames).toContain("BrowserErrorPlugin");
      expect(pluginNames).not.toContain("SimpleErrorPlugin");
    } finally {
      await client.suspend();
    }
  });
});
