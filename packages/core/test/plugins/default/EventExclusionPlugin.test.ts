import { Configuration } from "../../../src/configuration/Configuration.js";
import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import { IEvent } from "../../../src/models/IEvent.js";
import { IInnerError } from "../../../src/models/IInnerError.js";
import { EventExclusionPlugin } from "../../../src/plugins/default/EventExclusionPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";

beforeEach(() => {
  Configuration.defaults.updateSettingsWhenIdleInterval = -1;
});

describe("EventExclusionPlugin", () => {
  describe("should exclude log levels", () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: IEvent = { type: "log", source, data: {} };
      if (level) {
        ev.data["@level"] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    test("<null>", () => expect(run(null, null, null, null)).toBe(false));
    test("Test", () => expect(run("Test", null, null, null)).toBe(false));
    test("[Trace] Test", () => expect(run("Test", "Trace", null, null)).toBe(false));
    test("[Off] Test", () => expect(run("Test", "Off", null, null)).toBe(true));
    test("[Abc] Test", () => expect(run("Test", "Abc", null, null)).toBe(false));
    test("[Trace] <null> (source min level: Off", () => expect(run(null, "Trace", "@@log:", "Off")).toBe(true));
    test("[Trace] <null> (global min level: Off", () => expect(run(null, "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] <undefined> (source min level: Off", () => expect(run(undefined, "Trace", "@@log:", "Off")).toBe(true));
    test("[Trace] <undefined> (global min level: Off", () => expect(run(undefined, "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] <empty> (source min level: Off", () => expect(run("", "Trace", "@@log:", "Off")).toBe(true)); // Becomes Global Log Level
    test("[Trace] <empty> (global min level: Off", () => expect(run("", "Trace", "@@log:*", "Off")).toBe(true));
    test("[Trace] Test (source min level: false)", () => expect(run("Test", "Trace", "@@log:Test", "false")).toBe(true));
    test("[Trace] Test (source min level: no)", () => expect(run("Test", "Trace", "@@log:Test", "no")).toBe(true));
    test("[Trace] Test (source min level: 0)", () => expect(run("Test", "Trace", "@@log:Test", "0")).toBe(true));
    test("[Trace] Test (source min level: true)", () => expect(run("Test", "Trace", "@@log:Test", "true")).toBe(false));
    test("[Trace] Test (source min level: yes)", () => expect(run("Test", "Trace", "@@log:Test", "yes")).toBe(false));
    test("[Trace] Test (source min level: 1)", () => expect(run("Test", "Trace", "@@log:Test", "1")).toBe(false));
    test("[Trace] Test (source min level: Debug)", () => expect(run("Test", "Trace", "@@log:Test", "Debug")).toBe(true));
    test("[Info] Test (source min level: Debug)", () => expect(run("Test", "Info", "@@log:Test", "Debug")).toBe(false));
    test("[Trace] Test (global min level: Debug)", () => expect(run("Test", "Trace", "@@log:*", "Debug")).toBe(true));
    test("[Warn] Test (global min level: Debug)", () => expect(run("Test", "Warn", "@@log:*", "Debug")).toBe(false));
  });

  describe("should exclude log levels with info default", () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();
      client.config.settings["@@log:*"] = "Info";
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: IEvent = { type: "log", source, data: {} };
      if (level) {
        ev.data["@level"] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    test("<null>", () => expect(run(null, null, null, null)).toBe(false));
    test("Test", () => expect(run("Test", null, null, null)).toBe(false));
    test("[Trace] Test", () => expect(run("Test", "Trace", null, null)).toBe(true));
    test("[Warn] Test", () => expect(run("Test", "Warn", null, null)).toBe(false));
    test("[Error] Test (source min level: Debug)", () => expect(run("Test", "Error", "@@log:Test", "Debug")).toBe(false));
    test("[Debug] Test (source min level: Debug)", () => expect(run("Test", "Debug", "@@log:Test", "Debug")).toBe(false));
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
    function run(type: string, source: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const context = new EventPluginContext(client, { type, source, data: {} });
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    test("<null>", () => expect(run(null, null, null, null)).toBe(false));
    test("usage=<null>", () => expect(run("usage", null, null, null)).toBe(false));
    test("usage=test", () => expect(run("usage", "test", null, null)).toBe(false));
    test("usage=test on", () => expect(run("usage", "test", "@@usage:Test", "true")).toBe(false));
    test("usage=test off", () => expect(run("usage", "test", "@@usage:Test", "false")).toBe(true));
    test("usage=test (global off)", () => expect(run("usage", "test", "@@usage:*", "false")).toBe(true));
    test("404=/unknown (global off)", () => expect(run("404", "/unknown", "@@404:*", "false")).toBe(true));
    test("404=/unknown on", () => expect(run("404", "/unknown", "@@404:/unknown", "true")).toBe(false));
    test("404=/unknown off", () => expect(run("404", "/unknown", "@@404:/unknown", "false")).toBe(true));
    test("404=<null> off", () => expect(run("404", null, "@@404:*", "false")).toBe(true));
    test("404=<undefined> empty off", () => expect(run("404", undefined, "@@404:", "false")).toBe(true));
    test("404=<undefined> global off", () => expect(run("404", undefined, "@@404:*", "false")).toBe(true));
    test("404=<null> empty off", () => expect(run("404", null, "@@404:", "false")).toBe(true));
    test("404=<empty> off", () => expect(run("404", "", "@@404:", "false")).toBe(true));
  });

  describe("should exclude exception type", () => {
    function run(settingKey: string): boolean {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = "false";
      }

      const context = new EventPluginContext(client, {
        type: "error",
        data: {
          "@error": <IInnerError>{
            type: "ReferenceError",
            message: "This is a test",
            stack_trace: []
          }
        }
      });

      const plugin = new EventExclusionPlugin();
      plugin.run(context);
      return context.cancelled;
    }

    test("<null>", () => expect(run(null)).toBe(false));
    test("@@error:Error", () => expect(run("@@error:Error")).toBe(false));
    test("@@error:ReferenceError", () => expect(run("@@error:ReferenceError")).toBe(true));
    test("@@error:*Error", () => expect(run("@@error:*Error")).toBe(true));
    test("@@error:*", () => expect(run("@@error:*")).toBe(true));
  });
});
