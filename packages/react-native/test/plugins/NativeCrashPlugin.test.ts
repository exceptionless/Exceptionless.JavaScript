import { beforeEach, describe, expect, test, vi } from "vitest";

import { ExceptionlessClient } from "@exceptionless/core";
import type { CrashReport, ExceptionlessNativeModuleInterface } from "../../src/native/ExceptionlessNativeModule.js";
import { NativeCrashPlugin } from "../../src/plugins/NativeCrashPlugin.js";

const nativeModuleMock = vi.hoisted(() => ({
  current: null as ExceptionlessNativeModuleInterface | null
}));

vi.mock("../../src/native/ExceptionlessNativeModule.js", () => ({
  getNativeModule: () => nativeModuleMock.current,
  isNativeModuleAvailable: () => nativeModuleMock.current !== null
}));

describe("NativeCrashPlugin", () => {
  let plugin: NativeCrashPlugin;
  let client: ExceptionlessClient;

  beforeEach(() => {
    nativeModuleMock.current = null;
    vi.clearAllMocks();

    plugin = new NativeCrashPlugin();
    client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
  });

  test("should have priority 1 (runs first)", () => {
    expect(plugin.priority).toBe(1);
  });

  test("should have correct name", () => {
    expect(plugin.name).toBe("NativeCrashPlugin");
  });

  test("should be a no-op on non-iOS platforms", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "web",
      writable: true
    });

    await expect(
      plugin.startup({
        client,
        log: client.config.services.log
      })
    ).resolves.toBeUndefined();

    Object.defineProperty(Platform, "OS", {
      value: "android",
      writable: true
    });
    const warnSpy = vi.spyOn(client.config.services.log, "warn");

    await expect(
      plugin.startup({
        client,
        log: client.config.services.log
      })
    ).resolves.toBeUndefined();

    expect(warnSpy).not.toHaveBeenCalled();

    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
  });

  test("should log warning when native module is unavailable on iOS", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    const warnSpy = vi.spyOn(client.config.services.log, "warn");
    await plugin.startup({
      client,
      log: client.config.services.log
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Native crash reporter module not available"));

    warnSpy.mockRestore();
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });
  });

  test("should submit pending native crash reports and clear them after successful submission", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    const report = createCrashReport();
    const nativeModule = createNativeModule([report]);
    nativeModuleMock.current = nativeModule;

    const submit = vi.fn().mockResolvedValue(undefined);
    const setProperty = vi.fn().mockReturnThis();
    const createUnhandledException = vi.spyOn(client, "createUnhandledException").mockReturnValue({
      setProperty,
      submit
    } as never);

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    expect(nativeModule.install).toHaveBeenCalledOnce();
    expect(nativeModule.hasPendingCrashReport).toHaveBeenCalledOnce();
    expect(nativeModule.getPendingCrashReports).toHaveBeenCalledOnce();
    expect(createUnhandledException).toHaveBeenCalledOnce();

    const [error, source] = createUnhandledException.mock.calls[0];
    expect(source).toBe("NativeCrashReporter");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NSInvalidArgumentException");
    expect(error.message).toBe("Native crash from unit test");
    expect(error.stack).toContain("    at -[CrashyViewController crash] (unknown+42)");
    expect(error.stack).toContain("    at 0x100000abc (ExceptionlessExpoExample)");

    expect(setProperty).toHaveBeenCalledWith("native_crash", {
      signal_name: "SIGABRT",
      signal_code: "0",
      exception_type: "NSException",
      crashed_thread: 3,
      device: report.device,
      timestamp: report.timestamp
    });
    expect(submit).toHaveBeenCalledOnce();
    expect(nativeModule.clearPendingCrashReports).toHaveBeenCalledOnce();
    expect(submit.mock.invocationCallOrder[0]).toBeLessThan(nativeModule.clearPendingCrashReports.mock.invocationCallOrder[0]);
  });

  test("should not clear pending native crash reports when a pending marker returns no reports", async () => {
    const { Platform } = await import("react-native");
    Object.defineProperty(Platform, "OS", {
      value: "ios",
      writable: true
    });

    const nativeModule = createNativeModule([]);
    nativeModuleMock.current = nativeModule;

    const warnSpy = vi.spyOn(client.config.services.log, "warn");
    const createUnhandledException = vi.spyOn(client, "createUnhandledException");

    await plugin.startup({
      client,
      log: client.config.services.log
    });

    expect(nativeModule.install).toHaveBeenCalledOnce();
    expect(nativeModule.hasPendingCrashReport).toHaveBeenCalledOnce();
    expect(nativeModule.getPendingCrashReports).toHaveBeenCalledOnce();
    expect(createUnhandledException).not.toHaveBeenCalled();
    expect(nativeModule.clearPendingCrashReports).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("Native crash reporter indicated a pending crash, but no crash reports were returned.");
  });
});

function createNativeModule(reports: CrashReport[], hasPending = true) {
  return {
    install: vi.fn(),
    hasPendingCrashReport: vi.fn().mockResolvedValue(hasPending),
    getPendingCrashReports: vi.fn().mockResolvedValue(reports),
    clearPendingCrashReports: vi.fn().mockResolvedValue(undefined)
  };
}

function createCrashReport(): CrashReport {
  return {
    timestamp: "2026-05-31T03:00:00.000Z",
    signal_name: "SIGABRT",
    signal_code: "0",
    exception_type: "NSException",
    exception_name: "NSInvalidArgumentException",
    exception_reason: "Native crash from unit test",
    crashed_thread: 3,
    threads: [
      {
        thread_id: 1,
        crashed: false,
        frames: [
          {
            address: "0x100000001",
            image: "UIKit",
            symbol: "UIApplicationMain",
            offset: 12
          }
        ]
      },
      {
        thread_id: 3,
        crashed: true,
        frames: [
          {
            address: "0x100000123",
            image: null,
            symbol: "-[CrashyViewController crash]",
            offset: 42
          },
          {
            address: "0x100000abc",
            image: "ExceptionlessExpoExample",
            symbol: null,
            offset: null
          }
        ]
      }
    ],
    device: {
      model: "iPad Pro 11-inch",
      os_version: "iOS 18.0",
      app_version: "1.0.0"
    }
  };
}
