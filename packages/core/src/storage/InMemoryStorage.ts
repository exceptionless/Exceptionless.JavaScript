import { IStorage } from "./IStorage.js";

export class InMemoryStorage implements IStorage {
  private items = new Map<string, string>();

  constructor(private maxItems: number = 250) { }

  public get length(): Promise<number> {
    return Promise.resolve(this.items.size);
  }

  public clear(): Promise<void> {
    this.items.clear();
    return Promise.resolve();
  }

  public getItem(key: string): Promise<string> {
    return Promise.resolve(this.items.get(key));
  }

  public key(index: number): Promise<string> {
    const keys = Array.from(this.items.keys())
    return Promise.resolve(keys[index]);
  }

  public removeItem(key: string): Promise<void> {
    this.items.delete(key);
    return Promise.resolve();
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.items.set(key, value);
    while (this.items.size > this.maxItems) {
      await this.removeItem(await this.key(0));
    }
  }
}
