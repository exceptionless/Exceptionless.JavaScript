import { Configuration } from "../../../src/configuration/Configuration.js";
import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import {
  Event,
  KnownEventDataKeys
} from "../../../src/models/Event.js";
import { InnerErrorInfo } from "../../../src/models/data/ErrorInfo.js";
import { EventExclusionPlugin } from "../../../src/plugins/default/EventExclusionPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";

describe("EventExclusionPlugin", () => {
  describe("should exclude log levels", () => {
    const run = async (source: string, level: string, settingKey: string, settingValue: string): Promise<boolean> => {
      const client = new ExceptionlessClient();
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: Event = { type: "log", source, data: {} };
      if (level) {
        ev.data[KnownEventDataKeys.Level] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    }

    test("<null>", async () => expect(await run(null, null, null, null)).toBe(false));
    test("Test", async () => expect(await run("Test", null, null, null)).toBe(false));
    test("[Trace] Test", async () => expect(await run("Test", "Trace", null, null)).toBe(false));
    test("[Off] Test", async () => expect(await run("Test", "Off", null, null)).toBe(true));
    test("[Abc] Test", async () => expect(await run("Test", "Abc", null, null)).toBe(false));
    test("[Trace] <null> (source min level: Off", async () => expect(await run(null, "Trace", "@@log:", "Off")).toBe(true));
    test("[Trace] <null> (global min level: Off", async () => expect(await run(null, "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] <undefined> (source min level: Off", async () => expect(await run(undefined, "Trace", "@@log:", "Off")).toBe(true));
    test("[Trace] <undefined> (global min level: Off", async () => expect(await run(undefined, "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] <empty> (source min level: Off", async () => expect(await run("", "Trace", "@@log:", "Off")).toBe(true)); // Becomes Global Log Level
    test("[Trace] <empty> (global min level: Off", async () => expect(await run("", "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] Test (source min level: false)", async () => expect(await run("Test", "Trace", "@@log:Test", "false")).toBe(true));
    test("[Trace] Test (source min level: no)", async () => expect(await run("Test", "Trace", "@@log:Test", "no")).toBe(true));
    test("[Trace] Test (source min level: 0)", async () => expect(await run("Test", "Trace", "@@log:Test", "0")).toBe(true));
    test("[Trace] Test (source min level: true)", async () => expect(await run("Test", "Trace", "@@log:Test", "true")).toBe(false));
    test("[Trace] Test (source min level: yes)", async () => expect(await run("Test", "Trace", "@@log:Test", "yes")).toBe(false));
    test("[Trace] Test (source min level: 1)", async () => expect(await run("Test", "Trace", "@@log:Test", "1")).toBe(false));
    test("[Trace] Test (source min level: Debug)", async () => expect(await run("Test", "Trace", "@@log:Test", "Debug")).toBe(true));
    test("[Info] Test (source min level: Debug)", async () => expect(await run("Test", "Info", "@@log:Test", "Debug")).toBe(false));
    test("[Trace] Test (global min level: Debug)", async () => expect(await run("Test", "Trace", "@@log:*", "Debug")).toBe(true));
    test("[Warn] Test (global min level: Debug)", async () => expect(await run("Test", "Warn", "@@log:*", "Debug")).toBe(false));
  });

  describe("should exclude log levels with info default", () => {
    const run = async (source: string, level: string, settingKey: string, settingValue: string): Promise<boolean> => {
      const client = new ExceptionlessClient();
      client.config.settings["@@log:*"] = "Info";
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: Event = { type: "log", source, data: {} };
      if (level) {
        ev.data[KnownEventDataKeys.Level] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    }

    test("<null>", async () => expect(await run(null, null, null, null)).toBe(false));
    test("Test", async () => expect(await run("Test", null, null, null)).toBe(false));
    test("[Trace] Test", async () => expect(await run("Test", "Trace", null, null)).toBe(true));
    test("[Warn] Test", async () => expect(await run("Test", "Warn", null, null)).toBe(false));
    test("[Error] Test (source min level: Debug)", async () => expect(await run("Test", "Error", "@@log:Test", "Debug")).toBe(false));
    test("[Debug] Test (source min level: Debug)", async () => expect(await run("Test", "Debug", "@@log:Test", "Debug")).toBe(false));
  });

  describe("should resolve null and undefined log source levels in reverse settings order", () => {
    const plugin = new EventExclusionPlugin();
    const settings: Record<string, string> = { "@@log:": "Info", "@@log:*": "Debug" };

    test("<null> (global min level: info)", () => expect(plugin.getMinLogLevel(settings, null)).toBe(2));
    test("<undefined> (global min level: info)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(2));
    test("<empty> (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(2));
    test("* (global min level: debug)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(1));
  });

  describe("should resolve log source levels and respect settings order", () => {
    const plugin = new EventExclusionPlugin();
    const settings = { "@@log:*": "Debug", "@@log:": "Info" };

    test("<empty> (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(2));
    test("* (global min level: debug)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(1));
  });

  describe("should fallback to global log level setting", () => {
    const plugin = new EventExclusionPlugin();
    const settings = {
      "@@log:*": "Fatal",
    };

    test("<undefined> (source min level: off)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(5));
    test("<null> (source min level: off)", () => expect(plugin.getMinLogLevel(settings, null)).toBe(5));
    test("<empty> (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "")).toBe(5));
    test("* (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "*")).toBe(5));
    test("abc (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "abc")).toBe(5));
  });

  describe("should respect min log levels settings order with global settings", () => {
    const plugin = new EventExclusionPlugin();
    const settings = {
      "@@log:*": "Fatal",
      "@@log:": "Debug",
      "@@log:abc*": "Off",
      "@@log:abc.de*": "Debug",
      "@@log:abc.def*": "Info",
      "@@log:abc.def.ghi": "Trace"
    };

    test("<undefined> (source min level: debug)", () => expect(plugin.getMinLogLevel(settings, undefined)).toBe(1));
    test("<null> (source min level: debug)", () => expect(plugin.getMinLogLevel(settings, null)).toBe(1));
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
      "@@log:abc.def.ghi": "Trace",
      "@@log:abc.def*": "Info",
      "@@log:abc*": "Off"
    };

    test("abc (source min level: off)", () => expect(plugin.getMinLogLevel(settings, "abc")).toBe(6));
    test("abc.def (source min level: info)", () => expect(plugin.getMinLogLevel(settings, "abc.def")).toBe(2));
    test("abc.def.ghi (source min level: trace)", () => expect(plugin.getMinLogLevel(settings, "abc.def.ghi")).toBe(0));
  });

  describe("should exclude source type", () => {
    const run = async (type: string, source: string, settingKey: string, settingValue: string): Promise<boolean> => {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const context = new EventPluginContext(client, { type, source, data: {} });
      const plugin = new EventExclusionPlugin();
      await plugin.run(context);

      return context.cancelled;
    }

    test("<null>", async () => expect(await run(null, null, null, null)).toBe(false));
    test("usage=<null>", async () => expect(await run("usage", null, null, null)).toBe(false));
    test("usage=test", async () => expect(await run("usage", "test", null, null)).toBe(false));
    test("usage=test on", async () => expect(await run("usage", "test", "@@usage:Test", "true")).toBe(false));
    test("usage=test off", async () => expect(await run("usage", "test", "@@usage:Test", "false")).toBe(true));
    test("usage=test (global off)", async () => expect(await run("usage", "test", "@@usage:*", "false")).toBe(true));
    test("404=/unknown (global off)", async () => expect(await run("404", "/unknown", "@@404:*", "false")).toBe(true));
    test("404=/unknown on", async () => expect(await run("404", "/unknown", "@@404:/unknown", "true")).toBe(false));
    test("404=/unknown off", async () => expect(await run("404", "/unknown", "@@404:/unknown", "false")).toBe(true));
    test("404=<null> off", async () => expect(await run("404", null, "@@404:*", "false")).toBe(true));
    test("404=<undefined> empty off", async () => expect(await run("404", undefined, "@@404:", "false")).toBe(true));
    test("404=<undefined> global off", async () => expect(await run("404", undefined, "@@404:*", "false")).toBe(true));
    test("404=<null> empty off", async () => expect(await run("404", null, "@@404:", "false")).toBe(true));
    test("404=<empty> off", async () => expect(await run("404", "", "@@404:", "false")).toBe(true));
  });

  describe("should exclude exception type", () => {
    const run = async (settingKey: string): Promise<boolean> => {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = "false";
      }

      const context = new EventPluginContext(client, {
        type: "error",
        data: {
          "@error": <InnerErrorInfo>{
            type: "ReferenceError",
            message: "This is a test",
            stack_trace: []
          }
        }
      });

      const plugin = new EventExclusionPlugin();
      await plugin.run(context);
      return context.cancelled;
    }

    test("<null>", async () => expect(await run(null)).toBe(false));
    test("@@error:Error", async () => expect(await run("@@error:Error")).toBe(false));
    test("@@error:ReferenceError", async () => expect(await run("@@error:ReferenceError")).toBe(true));
    test("@@error:*Error", async () => expect(await run("@@error:*Error")).toBe(true));
    test("@@error:*", async () => expect(await run("@@error:*")).toBe(true));
  });
});
