import { afterEach, beforeEach, describe, expect, test } from "vitest";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { AsyncStorageProvider } from "../../src/storage/AsyncStorageProvider.js";

describe("AsyncStorageProvider", () => {
  let storage: AsyncStorageProvider;

  beforeEach(() => {
    const mock = AsyncStorage as unknown as { __reset: () => void };
    mock.__reset();
    storage = new AsyncStorageProvider();
  });

  afterEach(() => {
    const mock = AsyncStorage as unknown as { __reset: () => void };
    mock.__reset();
  });

  test("should return 0 length when empty", async () => {
    expect(await storage.length()).toBe(0);
  });

  test("should set and get items with prefix", async () => {
    await storage.setItem("test-key", "test-value");
    const value = await storage.getItem("test-key");
    expect(value).toBe("test-value");
  });

  test("should return null for missing keys", async () => {
    const value = await storage.getItem("nonexistent");
    expect(value).toBeNull();
  });

  test("should remove items", async () => {
    await storage.setItem("key1", "value1");
    await storage.removeItem("key1");
    expect(await storage.getItem("key1")).toBeNull();
    expect(await storage.length()).toBe(0);
  });

  test("should only count prefixed keys", async () => {
    await storage.setItem("a", "1");
    await storage.setItem("b", "2");
    await AsyncStorage.setItem("other-key", "other-value");
    expect(await storage.length()).toBe(2);
  });

  test("should clear only prefixed keys", async () => {
    await storage.setItem("a", "1");
    await AsyncStorage.setItem("other-key", "other-value");
    await storage.clear();
    expect(await storage.length()).toBe(0);
    expect(await AsyncStorage.getItem("other-key")).toBe("other-value");
  });

  test("should return keys without prefix", async () => {
    await storage.setItem("alpha", "1");
    await storage.setItem("beta", "2");
    const keys = await storage.keys();
    expect(keys).toContain("alpha");
    expect(keys).toContain("beta");
    expect(keys).toHaveLength(2);
  });

  test("should return key by index", async () => {
    await storage.setItem("first", "1");
    await storage.setItem("second", "2");
    const key0 = await storage.key(0);
    const key1 = await storage.key(1);
    const key2 = await storage.key(2);
    expect(key0).not.toBeNull();
    expect(key1).not.toBeNull();
    expect(key2).toBeNull();
  });
});
