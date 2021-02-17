import { KeyValueStorageBase } from '@exceptionless/core';

export class BrowserStorage extends KeyValueStorageBase {
  private prefix: string;

  public static isAvailable(): boolean {
    try {
      const storage = window.localStorage;
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  constructor(namespace: string, prefix: string = 'com.exceptionless.', maxItems: number = 20) {
    super(maxItems);

    this.prefix = prefix + namespace + '-';
  }

  public writeValue(key: string, value: string): void {
    window.localStorage.setItem(key, value);
  }

  public readValue(key: string): string {
    return window.localStorage.getItem(key);
  }

  public removeValue(key: string): void {
    window.localStorage.removeItem(key);
  }

  public getAllKeys(): string[] {
    return Object.keys(window.localStorage)
      .filter((key) => key.indexOf(this.prefix) === 0);
  }

  public getKey(timestamp: number): string {
    return this.prefix + timestamp;
  }

  public getTimestamp(key: string): number {
    return parseInt(key.substr(this.prefix.length), 10);
  }
}
