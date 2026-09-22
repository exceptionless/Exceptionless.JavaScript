import { afterEach, describe, expect, test, vi } from "vitest";

import { ConsoleLog } from "../../src/logging/ConsoleLog.js";

describe("ConsoleLog", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should invoke console methods with the console receiver", () => {
    const receivers: unknown[] = [];
    vi.spyOn(console, "debug").mockImplementation(function (this: unknown) {
      receivers.push(this);
    });

    new ConsoleLog().trace("test message");

    expect(receivers).toEqual([console]);
  });
});
