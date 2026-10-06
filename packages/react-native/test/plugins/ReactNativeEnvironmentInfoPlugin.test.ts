import { afterEach, describe, expect, test } from "vitest";

import { EventContext, EventPluginContext, ExceptionlessClient, KnownEventDataKeys } from "@exceptionless/core";
import type { EnvironmentInfo } from "@exceptionless/core";
import { ReactNativeEnvironmentInfoPlugin } from "../../src/plugins/ReactNativeEnvironmentInfoPlugin.js";

describe("ReactNativeEnvironmentInfoPlugin", () => {
  afterEach(async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
    Object.defineProperty(Platform, "Version", {
      value: "18.0",
      writable: true
    });
    Object.defineProperty(Platform, "constants", {
      value: {
        interfaceIdiom: "phone",
        isTesting: false,
        osVersion: "18.0",
        reactNativeVersion: {
          major: 0,
          minor: 85,
          patch: 3,
          prerelease: null
        },
        systemName: "iOS"
      },
      writable: true
    });
  });

  test("should add iOS environment info from React Native platform constants", async () => {
    const plugin = new ReactNativeEnvironmentInfoPlugin();
    const context = createContext();

    await plugin.run(context);

    const info = getEnvironmentInfo(context);
    expect(info.o_s_name).toBe("ios");
    expect(info.o_s_version).toBe("18.0");
    expect(info.runtime_version).toBe("react-native 0.85.3");
    expect(info.data).toMatchObject({
      deviceIdiom: "phone",
      isTesting: false,
      locale: expect.any(String),
      systemName: "iOS"
    });
  });

  test("should add Android environment info without requiring Expo modules", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "android",
      writable: true
    });
    Object.defineProperty(Platform, "Version", {
      value: 35,
      writable: true
    });
    Object.defineProperty(Platform, "constants", {
      value: {
        Brand: "google",
        Manufacturer: "Google",
        Model: "Pixel 9",
        Release: "16",
        isTesting: true,
        reactNativeVersion: {
          major: 0,
          minor: 85,
          patch: 3,
          prerelease: null
        },
        uiMode: "normal"
      },
      writable: true
    });
    const plugin = new ReactNativeEnvironmentInfoPlugin();
    const context = createContext();

    await plugin.run(context);

    const info = getEnvironmentInfo(context);
    expect(info.o_s_name).toBe("android");
    expect(info.o_s_version).toBe("16");
    expect(info.machine_name).toBe("Pixel 9");
    expect(info.data).toMatchObject({
      deviceBrand: "google",
      deviceManufacturer: "Google",
      deviceModel: "Pixel 9",
      isTesting: true,
      locale: expect.any(String),
      uiMode: "normal"
    });
  });

  test("should not overwrite existing environment info", async () => {
    const plugin = new ReactNativeEnvironmentInfoPlugin();
    const existing: EnvironmentInfo = {
      o_s_name: "custom"
    };
    const context = createContext(existing);

    await plugin.run(context);

    expect(getEnvironmentInfo(context)).toBe(existing);
  });
});

function createContext(environmentInfo?: EnvironmentInfo): EventPluginContext {
  return new EventPluginContext(
    new ExceptionlessClient(),
    {
      data: environmentInfo
        ? {
            [KnownEventDataKeys.EnvironmentInfo]: environmentInfo
          }
        : {}
    },
    new EventContext()
  );
}

function getEnvironmentInfo(context: EventPluginContext): EnvironmentInfo {
  return context.event.data?.[KnownEventDataKeys.EnvironmentInfo] as EnvironmentInfo;
}
