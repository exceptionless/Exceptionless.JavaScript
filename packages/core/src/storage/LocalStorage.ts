import { IStorage } from "./IStorage.js";

export class LocalStorage implements IStorage {
  constructor(private prefix: string = "exceptionless:") { }

  public length(): Promise<number> {
    return Promise.resolve(this.getKeys().length);
  }

  public clear(): Promise<void> {
    for (const key of this.getKeys()) {
      localStorage.removeItem(this.getKey(key));
    }

    return Promise.resolve();
  }

  public getItem(key: string): Promise<string> {
    return Promise.resolve(localStorage.getItem(this.getKey(key)));
  }

  public key(index: number): Promise<string> {
    const keys = this.getKeys();
    return Promise.resolve(index < keys.length ? keys[index] : null);
  }

  public keys(): Promise<string[]> {
    return Promise.resolve(this.getKeys());
  }

  public removeItem(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
    return Promise.resolve();
  }

  public setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(this.getKey(key), value);
    return Promise.resolve();
  }

  private getKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key?.substr(this.prefix.length));
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }
}
