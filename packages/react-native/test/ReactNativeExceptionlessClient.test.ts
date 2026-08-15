import { afterEach, describe, expect, test } from "vitest";

import { AsyncStorageProvider } from "../src/storage/AsyncStorageProvider.js";
import { ReactNativeExceptionlessClient } from "../src/ReactNativeExceptionlessClient.js";

describe("ReactNativeExceptionlessClient", () => {
  afterEach(async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
  });

  test("should configure documented react native plugins and persisted queue storage", async () => {
    const client = new ReactNativeExceptionlessClient();

    await client.startup((config) => {
      config.apiKey = "UNIT_TEST_API_KEY";
      config.updateSettingsWhenIdleInterval = -1;
    });

    try {
      const pluginNames = client.config.plugins.map((plugin) => plugin.name);

      expect(pluginNames).toContain("NativeCrashPlugin");
      expect(pluginNames).toContain("ReactNativeErrorPlugin");
      expect(pluginNames).toContain("ReactNativeEnvironmentInfoPlugin");
      expect(pluginNames).toContain("ReactNativeGlobalHandlerPlugin");
      expect(pluginNames).toContain("ReactNativeLifeCyclePlugin");
      expect(pluginNames).not.toContain("SimpleErrorPlugin");
      expect(client.config.services.storage).toBeInstanceOf(AsyncStorageProvider);
      expect(client.config.usePersistedQueueStorage).toBe(true);
    } finally {
      await client.suspend();
    }
  });

  test("should support startup with an api key string", async () => {
    const client = new ReactNativeExceptionlessClient();

    await client.startup("UNIT_TEST_API_KEY");

    try {
      expect(client.config.apiKey).toBe("UNIT_TEST_API_KEY");
      expect(client.config.plugins.map((plugin) => plugin.name)).toContain("ReactNativeGlobalHandlerPlugin");
    } finally {
      await client.suspend();
    }
  });

  test("should not configure native crash reporting on Android", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "android",
      writable: true
    });
    const client = new ReactNativeExceptionlessClient();

    await client.startup((config) => {
      config.apiKey = "UNIT_TEST_API_KEY";
      config.updateSettingsWhenIdleInterval = -1;
    });

    try {
      const pluginNames = client.config.plugins.map((plugin) => plugin.name);

      expect(pluginNames).not.toContain("NativeCrashPlugin");
      expect(pluginNames).toContain("ReactNativeErrorPlugin");
      expect(pluginNames).toContain("ReactNativeEnvironmentInfoPlugin");
      expect(pluginNames).toContain("ReactNativeGlobalHandlerPlugin");
      expect(pluginNames).toContain("ReactNativeLifeCyclePlugin");
      expect(pluginNames).not.toContain("SimpleErrorPlugin");
    } finally {
      await client.suspend();
    }
  });
});
