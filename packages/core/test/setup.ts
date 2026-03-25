import { beforeEach } from "vitest";

function createLocalStoragePolyfill(): Storage {
  const store: Record<string, string> = {};
  const storageTarget: Record<string, string> = {};

  return new Proxy(storageTarget, {
    get(target, prop) {
      if (prop === "getItem") {
        return (key: string): string | null => store[key] ?? null;
      }

      if (prop === "setItem") {
        return (key: string, value: string): void => {
          store[key] = value;
          target[key] = value;
        };
      }

      if (prop === "removeItem") {
        return (key: string): void => {
          delete store[key];
          delete target[key];
        };
      }

      if (prop === "clear") {
        return (): void => {
          Object.keys(store).forEach((key) => delete store[key]);
          Object.keys(target).forEach((key) => delete target[key]);
        };
      }

      if (prop === "length") {
        return Object.keys(store).length;
      }

      if (prop === "key") {
        return (index: number): string | null => Object.keys(store)[index] ?? null;
      }

      return target[prop as string];
    },
    ownKeys() {
      return Object.keys(store);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === "string" && prop in store) {
        return {
          enumerable: true,
          configurable: true,
          value: store[prop]
        };
      }

      return Object.getOwnPropertyDescriptor(target, prop);
    }
  }) as Storage;
}

if (typeof localStorage === "undefined" || typeof localStorage.clear !== "function") {
  Object.defineProperty(globalThis, "localStorage", {
    value: createLocalStoragePolyfill(),
    configurable: true,
    writable: true
  });
}

beforeEach(() => {
  localStorage.clear();
});
