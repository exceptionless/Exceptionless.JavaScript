import { beforeEach, describe, expect, test } from "vitest";

import { ErrorInfo, Event, EventContext, EventPluginContext, ExceptionlessClient, KnownEventDataKeys } from "@exceptionless/core";
import { ReactNativeErrorPlugin } from "../../src/plugins/ReactNativeErrorPlugin.js";

class CustomReactNativeError extends Error {
  public name = "CustomReactNativeError";
  public isComponentError = true;
  public jsEngine = "hermes";
}

describe("ReactNativeErrorPlugin", () => {
  let plugin: ReactNativeErrorPlugin;
  let context: EventPluginContext;

  beforeEach(() => {
    plugin = new ReactNativeErrorPlugin();
    context = new EventPluginContext(
      new ExceptionlessClient(),
      {
        data: {}
      },
      new EventContext()
    );
  });

  test("should parse Hermes Metro stack frames into error info", async () => {
    const error = new CustomReactNativeError("Component crashed inside error boundary!");
    error.stack = [
      "Error: Component crashed inside error boundary!",
      "    at CrashyComponent (http://localhost:8083/example/expo/index.bundle//&platform=ios&dev=true:127988:20)",
      "    at run (native)",
      "    at RCTView (<anonymous>)",
      "    at anonymous (http://localhost:8083/example/expo/index.bundle//&platform=ios&dev=true:24134:184)"
    ].join("\n");
    context.eventContext.setException(error);

    await plugin.run(context);

    const parsedError = getError(context.event);
    expect(parsedError?.type).toBe("CustomReactNativeError");
    expect(parsedError?.message).toBe("Component crashed inside error boundary!");
    expect(parsedError?.stack_trace).toEqual([
      expect.objectContaining({
        column: 20,
        file_name: "http://localhost:8083/example/expo/index.bundle//&platform=ios&dev=true",
        is_signature_target: true,
        line_number: 127988,
        name: "CrashyComponent"
      }),
      expect.objectContaining({
        column: 0,
        file_name: "native",
        line_number: 0,
        name: "run"
      }),
      expect.objectContaining({
        column: 0,
        file_name: "<anonymous>",
        line_number: 0,
        name: "RCTView"
      }),
      expect.objectContaining({
        column: 184,
        file_name: "http://localhost:8083/example/expo/index.bundle//&platform=ios&dev=true",
        line_number: 24134,
        name: "anonymous"
      })
    ]);
    expect(parsedError?.stack_trace?.[1].data?.is_native).toBe(true);
    expect(parsedError?.stack_trace?.[2].data?.is_native).toBe(true);
    expect(parsedError?.target_method).toEqual(parsedError?.stack_trace?.[0]);
    expect(parsedError?.data?.["@ext"]).toMatchObject({
      isComponentError: true,
      jsEngine: "hermes"
    });
  });

  test("should parse Hermes function-at-location stack frames", async () => {
    const error = new Error("Hermes failure");
    error.stack = [
      "Error: Hermes failure",
      "renderWithHooks@http://localhost:8083/index.bundle:25062:40",
      "anonymous@http://localhost:8083/index.bundle:24134:184"
    ].join("\n");
    context.eventContext.setException(error);

    await plugin.run(context);

    expect(getError(context.event)?.stack_trace).toEqual([
      expect.objectContaining({
        column: 40,
        file_name: "http://localhost:8083/index.bundle",
        line_number: 25062,
        name: "renderWithHooks"
      }),
      expect.objectContaining({
        column: 184,
        file_name: "http://localhost:8083/index.bundle",
        line_number: 24134,
        name: "anonymous"
      })
    ]);
  });

  test("should parse React Native Hermes dev stack frames", async () => {
    const error = new Error("This error was caught in try/catch");
    error.stack = [
      "Error: This error was caught in try/catch",
      "at ?anon_0_submitCaughtError() in http://10.0.1.53:8083/example/expo/index.bundle//&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable:line 127887:col 24",
      "at next() in native",
      "at anonymous() in address at InternalBytecode.js:line 1:col 6606",
      "at submitCaughtError() in http://10.0.1.53:8083/example/expo/index.bundle//&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable:line 127885:col 29"
    ].join("\n");
    context.eventContext.setException(error);

    await plugin.run(context);

    expect(getError(context.event)?.stack_trace).toEqual([
      expect.objectContaining({
        column: 24,
        file_name:
          "http://10.0.1.53:8083/example/expo/index.bundle//&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable",
        is_signature_target: true,
        line_number: 127887,
        name: "submitCaughtError"
      }),
      expect.objectContaining({
        column: 0,
        file_name: "native",
        line_number: 0,
        name: "next"
      }),
      expect.objectContaining({
        column: 6606,
        file_name: "InternalBytecode.js",
        line_number: 1,
        name: "anonymous"
      }),
      expect.objectContaining({
        column: 29,
        file_name:
          "http://10.0.1.53:8083/example/expo/index.bundle//&platform=ios&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable",
        line_number: 127885,
        name: "submitCaughtError"
      })
    ]);
    expect(getError(context.event)?.target_method?.name).toBe("submitCaughtError");
  });

  test("should normalize anonymous Hermes wrapper frames without leaking question marks", async () => {
    const error = new Error("Anonymous wrapper");
    error.stack = [
      "Error: Anonymous wrapper",
      "at ?anon_0() in http://localhost:8083/index.bundle:line 10:col 20",
      "at ?anon_0_submitCaughtError() in http://localhost:8083/index.bundle:line 11:col 21"
    ].join("\n");
    context.eventContext.setException(error);

    await plugin.run(context);

    expect(getError(context.event)?.stack_trace).toEqual([
      expect.objectContaining({
        name: "<anonymous>"
      }),
      expect.objectContaining({
        name: "submitCaughtError"
      })
    ]);
  });

  test("should not parse numeric error headers as stack frames", async () => {
    const error = new Error("404");
    error.stack = ["Error: 404", "at loadRoute() in http://localhost:8083/index.bundle:line 10:col 20"].join("\n");
    context.eventContext.setException(error);

    await plugin.run(context);

    expect(getError(context.event)?.stack_trace).toEqual([
      expect.objectContaining({
        column: 20,
        file_name: "http://localhost:8083/index.bundle",
        is_signature_target: true,
        line_number: 10,
        name: "loadRoute"
      })
    ]);
  });

  test("should attach React component stack to error data", async () => {
    const error = new Error("Component crashed inside error boundary!");
    const componentStack = "\n    at CrashyComponent (http://localhost:8083/index.bundle:10:20)";
    context.eventContext.setException(error);
    context.eventContext["@@_ComponentStack"] = componentStack;

    await plugin.run(context);

    expect(getError(context.event)?.data?.["@component_stack"]).toBe(componentStack);
    expect(context.event.data?.componentStack).toBeUndefined();
  });
});

function getError(event: Event): ErrorInfo | undefined {
  return event.data?.[KnownEventDataKeys.Error];
}
