import { IStorage } from "./IStorage.js";

export class InMemoryStorage implements IStorage {
  private items = new Map<string, string>();

  constructor() { }

  public length(): Promise<number> {
    return Promise.resolve(this.items.size);
  }

  public clear(): Promise<void> {
    this.items.clear();
    return Promise.resolve();
  }

  public getItem(key: string): Promise<string | null> {
    const value = this.items.get(key);
    return Promise.resolve(value ? value : null);
  }

  public async key(index: number): Promise<string | null> {
    if (index < 0)
      return Promise.resolve(null);

    const keys = await this.keys();

    if (index > keys.length)
      return Promise.resolve(null);

    const key = keys[index];
    return Promise.resolve(key ? key : null);
  }

  public keys(): Promise<string[]> {
    return Promise.resolve(Array.from(this.items.keys()));
  }

  public removeItem(key: string): Promise<void> {
    this.items.delete(key);
    return Promise.resolve();
  }

  public setItem(key: string, value: string): Promise<void> {
    this.items.set(key, value);
    return Promise.resolve();
  }
}
