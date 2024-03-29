import { IStorage } from "./IStorage.js";

export class LocalStorage implements IStorage {
  constructor(
    private prefix: string = "exceptionless-",
    private storage: Storage = globalThis.localStorage
  ) {}

  public length(): Promise<number> {
    return Promise.resolve(this.getKeys().length);
  }

  public clear(): Promise<void> {
    for (const key of this.getKeys()) {
      this.storage.removeItem(this.getKey(key));
    }

    return Promise.resolve();
  }

  public getItem(key: string): Promise<string | null> {
    return Promise.resolve(this.storage.getItem(this.getKey(key)));
  }

  public key(index: number): Promise<string | null> {
    const keys = this.getKeys();
    return Promise.resolve(index < keys.length ? keys[index] : null);
  }

  public keys(): Promise<string[]> {
    return Promise.resolve(this.getKeys());
  }

  public removeItem(key: string): Promise<void> {
    this.storage.removeItem(this.getKey(key));
    return Promise.resolve();
  }

  public setItem(key: string, value: string): Promise<void> {
    this.storage.setItem(this.getKey(key), value);
    return Promise.resolve();
  }

  private getKeys(): string[] {
    return Object.keys(this.storage)
      .filter((key) => key.startsWith(this.prefix))
      .map((key) => key?.substr(this.prefix.length));
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }
}
