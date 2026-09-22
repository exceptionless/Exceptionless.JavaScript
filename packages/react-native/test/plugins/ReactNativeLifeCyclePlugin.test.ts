import { beforeEach, describe, expect, test, vi } from "vitest";

import { ExceptionlessClient } from "@exceptionless/core";
import { ReactNativeLifeCyclePlugin } from "../../src/plugins/ReactNativeLifeCyclePlugin.js";

describe("ReactNativeLifeCyclePlugin", () => {
  let plugin: ReactNativeLifeCyclePlugin;
  let client: ExceptionlessClient;

  beforeEach(() => {
    plugin = new ReactNativeLifeCyclePlugin();
    client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
  });

  test("should have correct priority", () => {
    expect(plugin.priority).toBe(105);
  });

  test("should have correct name", () => {
    expect(plugin.name).toBe("ReactNativeLifeCyclePlugin");
  });

  test("should setup web listeners on web platform", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "web",
      writable: true
    });

    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    await plugin.startup({
      client,
      log: client.config.services.log
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    addEventListenerSpy.mockRestore();
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
  });

  test("should not setup handlers twice on repeated startup", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "web",
      writable: true
    });

    const addEventListenerSpy = vi.spyOn(globalThis, "addEventListener");
    await plugin.startup({
      client,
      log: client.config.services.log
    });
    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === "beforeunload");
    expect(beforeUnloadCalls).toHaveLength(1);

    addEventListenerSpy.mockRestore();
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
  });

  test("should keep lifecycle listeners active when client suspends", async () => {
    const { Platform } = await import("react-native");
    const { AppState } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    const subscription = {
      remove: vi.fn()
    };
    const addEventListenerSpy = vi.spyOn(AppState, "addEventListener").mockReturnValue(subscription);

    await plugin.startup({
      client,
      log: client.config.services.log
    });
    await expect(plugin.suspend()).resolves.toBeUndefined();
    expect(subscription.remove).not.toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  test("should end native session only when app enters background", async () => {
    const { Platform } = await import("react-native");
    const { AppState } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
    client.config.useSessions();

    const addEventListenerSpy = vi.spyOn(AppState, "addEventListener");
    const submitSessionEndSpy = vi.spyOn(client, "submitSessionEnd").mockResolvedValue("reference-id");
    const suspendSpy = vi.spyOn(client, "suspend").mockResolvedValue();

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const appStateHandler = addEventListenerSpy.mock.calls[0]?.[1];
    expect(appStateHandler).toBeDefined();
    appStateHandler?.("inactive");
    appStateHandler?.("background");

    expect(submitSessionEndSpy).toHaveBeenCalledTimes(1);
    expect(suspendSpy).toHaveBeenCalledTimes(1);

    addEventListenerSpy.mockRestore();
    submitSessionEndSpy.mockRestore();
    suspendSpy.mockRestore();
  });
});
