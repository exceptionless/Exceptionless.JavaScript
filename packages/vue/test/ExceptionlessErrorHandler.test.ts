import { beforeEach, describe, expect, test, vi } from "vitest";

import { ExceptionlessErrorHandler } from "../src/index.js";

const mocks = vi.hoisted(() => ({
  createException: vi.fn(),
  setProperty: vi.fn(),
  submit: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("@exceptionless/browser", () => {
  const builder = {
    setProperty: mocks.setProperty.mockImplementation(() => builder),
    submit: mocks.submit
  };

  return {
    Exceptionless: {
      createException: mocks.createException.mockImplementation(() => builder)
    },
    toError: (value: unknown) => (value instanceof Error ? value : new Error(String(value)))
  };
});

describe("ExceptionlessErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should record the component name and info instead of the component instance", async () => {
    const root: Record<string, unknown> = {
      $options: {
        name: "App"
      }
    };
    const vm = {
      $options: {
        __name: "Broken"
      },
      $root: root,
      $parent: root
    };
    root["$children"] = [vm];
    const error = new Error("Boom");

    await ExceptionlessErrorHandler(error, vm, "render function");

    expect(mocks.createException).toHaveBeenCalledWith(error);
    expect(mocks.setProperty.mock.calls).toEqual([
      ["component", "Broken"],
      ["info", "render function"]
    ]);
    expect(mocks.submit).toHaveBeenCalled();
  });

  test("should prefer the explicit component name", async () => {
    await ExceptionlessErrorHandler(
      new Error("Boom"),
      {
        $options: {
          name: "Named",
          __name: "File"
        }
      },
      "setup function"
    );

    expect(mocks.setProperty).toHaveBeenCalledWith("component", "Named");
  });

  test("should handle a missing instance and a non-error value", async () => {
    await ExceptionlessErrorHandler("Boom", null, "watcher callback");

    expect(mocks.createException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Boom"
      })
    );
    expect(mocks.setProperty.mock.calls).toEqual([["info", "watcher callback"]]);
    expect(mocks.submit).toHaveBeenCalled();
  });
});
