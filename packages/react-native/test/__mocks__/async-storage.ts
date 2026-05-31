const store = new Map<string, string>();

export default {
  getItem: (key: string): Promise<string | null> => Promise.resolve(store.get(key) ?? null),
  setItem: (key: string, value: string): Promise<void> => {
    store.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    store.delete(key);
    return Promise.resolve();
  },
  getAllKeys: (): Promise<string[]> => Promise.resolve([...store.keys()]),
  multiRemove: (keys: string[]): Promise<void> => {
    for (const key of keys) {
      store.delete(key);
    }
    return Promise.resolve();
  },
  clear: (): Promise<void> => {
    store.clear();
    return Promise.resolve();
  },
  __reset: (): void => {
    store.clear();
  }
};
