import { KeyValueStorageBase } from './KeyValueStorageBase';

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

  public write(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }

  public read(key: string) {
    return window.localStorage.getItem(key);
  }

  public readAllKeys() {
    return Object.keys(window.localStorage)
      .filter((key) => key.indexOf(this.prefix) === 0);
  }

  public delete(key: string) {
    window.localStorage.removeItem(key);
  }

  public getKey(timestamp) {
    return this.prefix + timestamp;
  }

  public getTimestamp(key) {
    return parseInt(key.substr(this.prefix.length), 10);
  }
}
