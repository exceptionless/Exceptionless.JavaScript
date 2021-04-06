import { IStorage } from "@exceptionless/core";

export class BrowserLocalStorage implements IStorage {
  constructor(private prefix: string = "exceptionless:") { }

  public length(): Promise<number> {
    return Promise.resolve(this.getKeys().length);
  }

  public clear(): Promise<void> {
    for (const key of this.getKeys()) {
      window.localStorage.removeItem(key);
    }

    return Promise.resolve();
  }

  public getItem(key: string): Promise<string> {
    return Promise.resolve(window.localStorage.getItem(this.getKey(key)));
  }

  public key(index: number): Promise<string> {
    const keys = this.getKeys();
    return Promise.resolve(keys[index]);
  }

  public keys(): Promise<string[]> {
    return Promise.resolve(this.getKeys());
  }

  public removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(this.getKey(key));
    return Promise.resolve();
  }

  public setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(this.getKey(key), value);
    return Promise.resolve();
  }

  private getKeys(): string[] {
    return Object.keys(window.localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key?.substr(this.prefix.length));
  }

  private getKey(key: string): string {
    return this.prefix + key;
  }
}
