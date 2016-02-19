import { KeyValueStorageBase } from './KeyValueStorageBase';

export class BrowserStorage extends KeyValueStorageBase {
  private prefix: string;

  static isAvailable(): boolean {
    try {
      let storage = window.localStorage,
        x = '__storage_test__';
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

  write(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }

  read(key: string) {
    return window.localStorage.getItem(key);
  }

  readAllKeys() {
    return Object.keys(window.localStorage)
      .filter(key => key.indexOf(this.prefix) === 0);
  }

  delete(key: string) {
    window.localStorage.removeItem(key);
  }

  getKey(timestamp) {
    return this.prefix + timestamp;
  }

  getTimestamp(key) {
    return parseInt(key.substr(this.prefix.length), 10);
  }
}
