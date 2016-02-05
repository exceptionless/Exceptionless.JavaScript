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

  constructor(prefix: string = 'com.exceptionless.', maxItems: number = 20, fs?: any) {
    super(maxItems);

    this.prefix = prefix;
  }

  write(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }

  read(key: string) {
    return window.localStorage.getItem(key);
  }

  readDate(key: string) {
    return Date.now();
  }

  delete(key: string) {
    window.localStorage.removeItem(key);
  }

  getEntries() {
    let regex = new RegExp('^' + regExEscape(this.prefix));
    let files = Object.keys(window.localStorage)
      .filter(f => regex.test(f))
      .map(f => f.substr(this.prefix.length));
    return files;
  }

  getKey(entry) {
    return this.prefix + super.getKey(entry);
  }
}

function regExEscape(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}
