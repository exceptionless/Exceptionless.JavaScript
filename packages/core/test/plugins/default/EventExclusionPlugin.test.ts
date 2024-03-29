import { describe, test } from "@jest/globals";
import { expect } from "expect";

import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import { Event, EventType, KnownEventDataKeys, LogLevel } from "../../../src/models/Event.js";
import { InnerErrorInfo } from "../../../src/models/data/ErrorInfo.js";
import { EventExclusionPlugin } from "../../../src/plugins/default/EventExclusionPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { EventContext } from "../../../src/models/EventContext.js";

describe("EventExclusionPlugin", () => {
  describe("should exclude log levels", () => {
    const run = async (
      source: string | undefined,
      level: LogLevel | null | undefined,
      settingKey: string | null | undefined,
      settingValue: string | null | undefined
    ): Promise<boolean> => {
      const client = new ExceptionlessClient();
      if (typeof settingKey == "string") {
        client.config.settings[settingKey] = settingValue as string;
      }

      const ev: Event = <Event>{ type: "log", source, data: {} };
      if (ev.data && level) {
        ev.data[KnownEventDataKeys.Level] = level;
      }

      const context = new EventPluginContext(client, ev, new EventContext());
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    };

    test("<null>", async () => expect(await run(undefined, null, null, null)).toBe(false));
    test("Test", async () => expect(await run("Test", null, null, null)).toBe(false));
    test("[trace] Test", async () => expect(await run("Test", "trace", null, null)).toBe(false));
    test("[Off] Test", async () => expect(await run("Test", "Off", null, null)).toBe(true));
    test("[Abc] Test", async () => expect(await run("Test", "Abc", null, null)).toBe(false));
    test("[trace] <null> (source min level: Off", async () => expect(await run(undefined, "trace", "@@log:", "Off")).toBe(true));
    test("[trace] <null> (global min level: Off", async () => expect(await run(undefined, "trace", "@@log:*", "Off")).toBe(true));
    test("[trace] <undefined> (source min level: Off", async () => expect(await run(undefined, "trace", "@@log:", "Off")).toBe(true));
    test("[trace] <undefined> (global min level: Off", async () => expect(await run(undefined, "trace", "@@log:*", "Off")).toBe(true));
    test("[trace] <empty> (source min level: Off", async () => expect(await run("", "trace", "@@log:", "Off")).toBe(true)); // Becomes Global Log Level
    test("[trace] <empty> (global min level: Off", async () => expect(await run("", "trace", "@@log:*", "Off")).toBe(true));
    test("[trace] Test (source min level: false)", async () => expect(await run("Test", "trace", "@@log:Test", "false")).toBe(true));
    test("[trace] Test (source min level: no)", async () => expect(await run("Test", "trace", "@@log:Test", "no")).toBe(true));
    test("[trace] Test (source min level: 0)", async () => expect(await run("Test", "trace", "@@log:Test", "0")).toBe(true));
    test("[trace] Test (source min level: true)", async () => expect(await run("Test", "trace", "@@log:Test", "true")).toBe(false));
    test("[trace] Test (source min level: yes)", async () => expect(await run("Test", "trace", "@@log:Test", "yes")).toBe(false));
    test("[trace] Test (source min level: 1)", async () => expect(await run("Test", "trace", "@@log:Test", "1")).toBe(false));
    test("[trace] Test (source min level: debug)", async () => expect(await run("Test", "trace", "@@log:Test", "debug")).toBe(true));
    test("[info] Test (source min level: debug)", async () => expect(await run("Test", "info", "@@log:Test", "debug")).toBe(false));
    test("[trace] Test (global min level: debug)", async () => expect(await run("Test", "trace", "@@log:*", "debug")).toBe(true));
    test("[warn] Test (global min level: debug)", async () => expect(await run("Test", "warn", "@@log:*", "debug")).toBe(false));
  });

  describe("should exclude log levels with info default", () => {
    const run = async (
      source: string | undefined,
      level: LogLevel | null | undefined,
      settingKey: string | null | undefined,
      settingValue: string | null | undefined
    ): Promise<boolean> => {
      const client = new ExceptionlessClient();
      client.config.settings["@@log:*"] = "info";
      if (typeof settingKey === "string") {
        client.config.settings[settingKey] = settingValue as string;
      }

      const ev: Event = <Event>{ type: "log", source, data: {} };
      if (ev.data && level) {
        ev.data[KnownEventDataKeys.Level] = level;
      }

      const context = new EventPluginContext(client, ev, new EventContext());
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    };

    test("<null>", async () => expect(await run(undefined, null, null, null)).toBe(false));
    test("Test", async () => expect(await run("Test", null, null, null)).toBe(false));
    test("[trace] Test", async () => expect(await run("Test", "trace", null, null)).toBe(true));
    test("[warn] Test", async () => expect(await run("Test", "warn", null, null)).toBe(false));
    test("[error] Test (source min level: debug)", async () => expect(await run("Test", "error", "@@log:Test", "debug")).toBe(false));
    test("[debug] Test (source min level: debug)", async () => expect(await run("Test", "debug", "@@log:Test", "debug")).toBe(false));
  });

  describe("should resolve null and undefined log source levels in reverse settings order", () => {
    const plugin = new EventExclusionPlugin();
    const settings: Record<string, string> = { "@@log:": "info", "@@log:*": "debug" };

    test("<undefined> (global min level: info)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(2));
    test("<empty> (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(2));
    test("* (global min level: debug)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(1));
  });

  describe("should resolve log source levels and respect settings order", () => {
    const plugin = new EventExclusionPlugin();
    const settings = { "@@log:*": "debug", "@@log:": "info" };

    test("<empty> (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(2));
    test("* (global min level: debug)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(1));
  });

  describe("should fallback to global log level setting", () => {
    const plugin = new EventExclusionPlugin();
    const settings = {
      "@@log:*": "Fatal"
    };

    test("<undefined> (source min level: off)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(5));
    test("<empty> (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(5));
    test("* (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(5));
    test("abc (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "abc")).toBe(5));
  });

  describe("should respect min log levels settings order with global settings", () => {
    const plugin = new EventExclusionPlugin();
    const settings = {
      "@@log:*": "Fatal",
      "@@log:": "debug",
      "@@log:abc*": "Off",
      "@@log:abc.de*": "debug",
      "@@log:abc.def*": "info",
      "@@log:abc.def.ghi": "trace"
    };

    test("<undefined> (source min level: debug)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(1));
    test("<empty> (source min level: debug)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(1));
    test("fallback (global min level: debug)", () => expect(plugin.getMinLogLevel(settings, "fallback")).toBe(5));
    test("abc (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "abc")).toBe(6));
    test("abc.def (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "abc.def")).toBe(2));
    test("abc.def.random (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "abc.def.random")).toBe(2));
    test("abc.def.ghi (source min level: trace)", () => expect(plugin.getMinLogLevel(settings, "abc.def.ghi")).toBe(0));
  });

  describe("should respect min log levels settings order", () => {
    const plugin = new EventExclusionPlugin();
    const settings = {
      "@@log:abc.def.ghi": "trace",
      "@@log:abc.def*": "info",
      "@@log:abc*": "Off"
    };

    test("abc (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "abc")).toBe(6));
    test("abc.def (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "abc.def")).toBe(2));
    test("abc.def.ghi (source min level: trace)", () => expect(plugin.getMinLogLevel(settings, "abc.def.ghi")).toBe(0));
  });

  describe("should exclude source type", () => {
    const run = async (
      type: EventType | null | undefined,
      source: string | undefined,
      settingKey: string | null | undefined,
      settingValue: string | null | undefined
    ): Promise<boolean> => {
      const client = new ExceptionlessClient();

      if (typeof settingKey === "string") {
        client.config.settings[settingKey] = settingValue as string;
      }

      const context = new EventPluginContext(client, <Event>{ type: <string>type, source, data: {} }, new EventContext());
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    };

    test("<null>", async () => expect(await run(null, undefined, null, null)).toBe(false));
    test("usage=<null>", async () => expect(await run("usage", undefined, null, null)).toBe(false));
    test("usage=test", async () => expect(await run("usage", "test", null, null)).toBe(false));
    test("usage=test on", async () => expect(await run("usage", "test", "@@usage:Test", "true")).toBe(false));
    test("usage=test off", async () => expect(await run("usage", "test", "@@usage:Test", "false")).toBe(true));
    test("usage=test (global off)", async () => expect(await run("usage", "test", "@@usage:*", "false")).toBe(true));
    test("404=/unknown (global off)", async () => expect(await run("404", "/unknown", "@@404:*", "false")).toBe(true));
    test("404=/unknown on", async () => expect(await run("404", "/unknown", "@@404:/unknown", "true")).toBe(false));
    test("404=/unknown off", async () => expect(await run("404", "/unknown", "@@404:/unknown", "false")).toBe(true));
    test("404=<null> off", async () => expect(await run("404", undefined, "@@404:*", "false")).toBe(true));
    test("404=<undefined> empty off", async () => expect(await run("404", undefined, "@@404:", "false")).toBe(true));
    test("404=<undefined> global off", async () => expect(await run("404", undefined, "@@404:*", "false")).toBe(true));
    test("404=<null> empty off", async () => expect(await run("404", undefined, "@@404:", "false")).toBe(true));
    test("404=<empty> off", async () => expect(await run("404", "", "@@404:", "false")).toBe(true));
  });

  describe("should exclude exception type", () => {
    const run = async (settingKey: string | null | undefined): Promise<boolean> => {
      const client = new ExceptionlessClient();

      if (typeof settingKey === "string") {
        client.config.settings[settingKey] = "false";
      }

      const context = new EventPluginContext(
        client,
        {
          type: "error",
          data: {
            "@error": <InnerErrorInfo>{
              type: "ReferenceError",
              message: "This is a test",
              stack_trace: []
            }
          }
        },
        new EventContext()
      );

      const plugin = new EventExclusionPlugin();
      await plugin.run(context);
      return context.cancelled;
    };

    test("<null>", async () => expect(await run(null)).toBe(false));
    test("@@error:Error", async () => expect(await run("@@error:Error")).toBe(false));
    test("@@error:ReferenceError", async () => expect(await run("@@error:ReferenceError")).toBe(true));
    test("@@error:*Error", async () => expect(await run("@@error:*Error")).toBe(true));
    test("@@error:*", async () => expect(await run("@@error:*")).toBe(true));
  });
});
