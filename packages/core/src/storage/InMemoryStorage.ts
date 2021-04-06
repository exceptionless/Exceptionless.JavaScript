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

  public getItem(key: string): Promise<string> {
    return Promise.resolve(this.items.get(key));
  }

  public async key(index: number): Promise<string> {
    const keys = await this.keys();
    return Promise.resolve(keys[index]);
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
