import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ExceptionlessClient } from "@exceptionless/core";
import { ReactNativeGlobalHandlerPlugin } from "../../src/plugins/ReactNativeGlobalHandlerPlugin.js";

describe("ReactNativeGlobalHandlerPlugin", () => {
  let plugin: ReactNativeGlobalHandlerPlugin;
  let client: ExceptionlessClient;
  const originalConsoleError = console.error;
  const globalWithHandlers = globalThis as typeof globalThis & {
    ErrorUtils?: {
      getGlobalHandler(): (error: Error, isFatal?: boolean) => void;
      setGlobalHandler(handler: (error: Error, isFatal?: boolean) => void): void;
    };
    RN$handleException?: (error: unknown, isFatal: boolean, reportToConsole: boolean) => boolean | void;
  };

  beforeEach(() => {
    plugin = new ReactNativeGlobalHandlerPlugin();
    client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
  });

  afterEach(async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
    console.error = originalConsoleError;
    delete globalWithHandlers.ErrorUtils;
    delete globalWithHandlers.RN$handleException;
    vi.restoreAllMocks();
  });

  test("should have correct priority", () => {
    expect(plugin.priority).toBe(100);
  });

  test("should have correct name", () => {
    expect(plugin.name).toBe("ReactNativeGlobalHandlerPlugin");
  });

  test("should setup web handlers on web platform", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "web",
      writable: true
    });

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    await plugin.startup({
      client,
      log: client.config.services.log
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith("error", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
  });

  test("should not register handlers twice", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "web",
      writable: true
    });

    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    await plugin.startup({
      client,
      log: client.config.services.log
    });
    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const errorCalls = addEventListenerSpy.mock.calls.filter(([event]) => event === "error");
    expect(errorCalls).toHaveLength(1);
  });

  test("should preserve existing native ErrorUtils handler", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    let registeredHandler: ((error: Error, isFatal?: boolean) => void) | undefined;
    const previousHandler = vi.fn();
    globalWithHandlers.ErrorUtils = {
      getGlobalHandler: vi.fn(() => previousHandler),
      setGlobalHandler: vi.fn((handler) => {
        registeredHandler = handler;
      })
    };
    const submitSpy = vi.spyOn(client, "submitUnhandledException").mockResolvedValue(undefined as never);

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const error = new Error("Unhandled native error");
    registeredHandler?.(error, true);

    expect(submitSpy).toHaveBeenCalledWith(error, "ErrorUtils.globalHandler");
    expect(previousHandler).toHaveBeenCalledWith(error, true);
  });

  test("should capture React Native promise rejections without swallowing the native handler", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    globalWithHandlers.ErrorUtils = {
      getGlobalHandler: vi.fn(() => vi.fn()),
      setGlobalHandler: vi.fn()
    };
    const previousNativeHandler = vi.fn(() => false);
    globalWithHandlers.RN$handleException = previousNativeHandler;
    const submitSpy = vi.spyOn(client, "submitUnhandledException").mockResolvedValue(undefined as never);

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const rejection = new Error("Rejected from async work");
    const reactNativeError = new Error('Uncaught (in promise, id: 0): "Error: Rejected from async work"', {
      cause: rejection
    });
    const handled = globalWithHandlers.RN$handleException?.(reactNativeError, false, true);

    expect(submitSpy).toHaveBeenCalledWith(rejection, "ReactNative.promiseRejectionTracking");
    expect(previousNativeHandler).toHaveBeenCalledWith(reactNativeError, false, true);
    expect(handled).toBe(false);
  });

  test("should wrap configurable React Native promise rejection handler when it is read-only", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    globalWithHandlers.ErrorUtils = {
      getGlobalHandler: vi.fn(() => vi.fn()),
      setGlobalHandler: vi.fn()
    };
    const previousNativeHandler = vi.fn(() => false);
    Object.defineProperty(globalWithHandlers, "RN$handleException", {
      configurable: true,
      value: previousNativeHandler,
      writable: false
    });
    const submitSpy = vi.spyOn(client, "submitUnhandledException").mockResolvedValue(undefined as never);

    await expect(
      plugin.startup({
        client,
        log: client.config.services.log
      })
    ).resolves.toBeUndefined();

    const rejection = new Error("Rejected from async work");
    const reactNativeError = new Error('Uncaught (in promise, id: 0): "Error: Rejected from async work"', {
      cause: rejection
    });
    const handled = globalWithHandlers.RN$handleException?.(reactNativeError, false, true);

    expect(submitSpy).toHaveBeenCalledWith(rejection, "ReactNative.promiseRejectionTracking");
    expect(previousNativeHandler).toHaveBeenCalledWith(reactNativeError, false, true);
    expect(handled).toBe(false);
  });

  test("should capture React Native promise rejections through console fallback when native handler cannot be wrapped", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    globalWithHandlers.ErrorUtils = {
      getGlobalHandler: vi.fn(() => vi.fn()),
      setGlobalHandler: vi.fn()
    };
    const previousNativeHandler = vi.fn(() => false);
    Object.defineProperty(globalWithHandlers, "RN$handleException", {
      configurable: true,
      value: previousNativeHandler,
      writable: false
    });

    const defineProperty = Object.defineProperty;
    vi.spyOn(Object, "defineProperty").mockImplementation((target, propertyKey, attributes) => {
      if (propertyKey === "RN$handleException") {
        throw new TypeError("Cannot redefine property");
      }

      return defineProperty(target, propertyKey, attributes);
    });
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const submitSpy = vi.spyOn(client, "submitUnhandledException").mockResolvedValue(undefined as never);

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    const rejection = new Error("Rejected from async work");
    const reactNativeError = new Error('Uncaught (in promise, id: 0): "Error: Rejected from async work"', {
      cause: rejection
    });
    console.error(reactNativeError);

    expect(submitSpy).toHaveBeenCalledWith(rejection, "ReactNative.promiseRejectionTracking");
    expect(consoleErrorSpy).toHaveBeenCalledWith(reactNativeError);
  });

  test("should not capture every React Native nonfatal exception as a promise rejection", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    globalWithHandlers.ErrorUtils = {
      getGlobalHandler: vi.fn(() => vi.fn()),
      setGlobalHandler: vi.fn()
    };
    const submitSpy = vi.spyOn(client, "submitUnhandledException").mockResolvedValue(undefined as never);

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    globalWithHandlers.RN$handleException?.(new Error("console.error from React Native"), false, false);

    expect(submitSpy).not.toHaveBeenCalled();
  });
});
