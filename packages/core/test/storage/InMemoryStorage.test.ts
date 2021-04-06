import { InMemoryStorage } from "../../src/storage/InMemoryStorage.js";
import { IStorage } from "../../src/storage/IStorage.js";

describeStorage(
  "InMemoryStorage",
  (): IStorage => new InMemoryStorage()
);

export function describeStorage(
  name: string,
  storageFactory: () => IStorage,
  afterEachCallback?: () => void,
  beforeEachCallback?: () => void
) {
  describe(name, () => {
    if (beforeEachCallback) {
      beforeEach(beforeEachCallback);
    }

    if (afterEachCallback) {
      afterEach(afterEachCallback);
    }

    test("can save item", async () => {
      const storage = storageFactory();
      expect(await storage.length()).toBe(0);
      expect(await storage.keys()).toEqual([]);
      expect(await storage.key(0)).toBeUndefined();

      const file: string = "event.json";
      const value: string = "test";

      await storage.setItem(file, value);
      expect(await storage.length()).toBe(1);
      expect(await storage.getItem(file)).toEqual(value);
      expect(await storage.keys()).toEqual([file]);
      expect(await storage.key(0)).toEqual(file);
    });

    test("can remove item", async () => {
      const storage = storageFactory();
      expect(await storage.length()).toBe(0);
      expect(await storage.keys()).toEqual([]);
      expect(await storage.key(0)).toBeUndefined();

      const file: string = "event.json";
      const value: string = "test";

      await storage.setItem(file, value);
      expect(await storage.length()).toBe(1);
      expect(await storage.keys()).toEqual([file]);
      expect(await storage.key(0)).toEqual(file);

      await storage.removeItem("random.json");
      expect(await storage.length()).toBe(1);
      expect(await storage.keys()).toEqual([file]);
      expect(await storage.key(0)).toEqual(file);

      await storage.removeItem(file);
      expect(await storage.length()).toBe(0);
      expect(await storage.keys()).toEqual([]);
      expect(await storage.key(0)).toBeUndefined();
    });

    test("can clear", async () => {
      const storage = storageFactory();
      expect(await storage.length()).toBe(0);
      expect(await storage.keys()).toEqual([]);
      expect(await storage.key(0)).toBeUndefined();

      await storage.setItem("event.json", "test");
      expect(await storage.length()).toBe(1);

      await storage.clear();
      expect(await storage.length()).toBe(0);
      expect(await storage.keys()).toEqual([]);
      expect(await storage.key(0)).toBeUndefined();
    });
  });
}
