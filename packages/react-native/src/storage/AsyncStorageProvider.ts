import type { IStorage } from "@exceptionless/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "@exceptionless:";

export class AsyncStorageProvider implements IStorage {
  public async length(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  public async clear(): Promise<void> {
    const prefixedKeys = await this.getPrefixedKeys();
    if (prefixedKeys.length > 0) {
      await AsyncStorage.multiRemove(prefixedKeys);
    }
  }

  public async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(KEY_PREFIX + key);
  }

  public async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(KEY_PREFIX + key, value);
  }

  public async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(KEY_PREFIX + key);
  }

  public async key(index: number): Promise<string | null> {
    const keys = await this.keys();
    return index < keys.length ? keys[index] : null;
  }

  public async keys(): Promise<string[]> {
    const prefixedKeys = await this.getPrefixedKeys();
    return prefixedKeys.map((k) => k.slice(KEY_PREFIX.length));
  }

  private async getPrefixedKeys(): Promise<string[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter((k: string) => k.startsWith(KEY_PREFIX));
  }
}
