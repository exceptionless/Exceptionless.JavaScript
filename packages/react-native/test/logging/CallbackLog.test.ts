import { describe, expect, test, vi } from "vitest";

import { ConsoleLog, NullLog } from "@exceptionless/core";

import { CallbackLog } from "../../src/logging/CallbackLog.js";
import type { LogEntry } from "../../src/logging/CallbackLog.js";

describe("CallbackLog", () => {
  test("should forward messages to inner logger", () => {
    const inner = { trace: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const log = new CallbackLog(inner);

    log.trace("t");
    log.info("i");
    log.warn("w");
    log.error("e");

    expect(inner.trace).toHaveBeenCalledWith("t");
    expect(inner.info).toHaveBeenCalledWith("i");
    expect(inner.warn).toHaveBeenCalledWith("w");
    expect(inner.error).toHaveBeenCalledWith("e");
  });

  test("should notify subscribers with log entries", () => {
    const log = new CallbackLog(new NullLog());
    const entries: LogEntry[] = [];
    log.subscribe((entry) => entries.push(entry));

    log.info("hello");
    log.error("oops");

    expect(entries).toHaveLength(2);
    expect(entries[0].level).toBe("info");
    expect(entries[0].message).toBe("hello");
    expect(entries[1].level).toBe("error");
    expect(entries[1].message).toBe("oops");
  });

  test("should unsubscribe when calling returned function", () => {
    const log = new CallbackLog(new NullLog());
    const entries: LogEntry[] = [];
    const unsubscribe = log.subscribe((entry) => entries.push(entry));

    log.info("before");
    unsubscribe();
    log.info("after");

    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("before");
  });

  test("should not break if subscriber throws", () => {
    const inner = { trace: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const log = new CallbackLog(inner);
    const good: LogEntry[] = [];

    log.subscribe(() => {
      throw new Error("bad subscriber");
    });
    log.subscribe((entry) => good.push(entry));

    log.info("test");

    expect(inner.info).toHaveBeenCalledWith("test");
    expect(good).toHaveLength(1);
    expect(good[0].message).toBe("test");
  });

  test("should work with ConsoleLog as inner", () => {
    const log = new CallbackLog(new ConsoleLog());
    const entries: LogEntry[] = [];
    log.subscribe((entry) => entries.push(entry));

    log.warn("test warning");

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("warn");
  });
});
