import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

interface IndexEntry {
  name: string;
  timestamp: number;
}

export class BrowserStorage implements IStorage {
  private prefix: string;
  private maxItems: number;
  private timestamp: number;
  private index: IndexEntry[];

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
    this.prefix = prefix;
    this.maxItems = maxItems;

    this.index = this.createIndex();
    this.timestamp = this.index.length > 0
      ? this.index[this.index.length - 1].timestamp
      : 0;
  }

  save(path: string, value: any): boolean {
    if (!path || !value) {
      return false;
    }

    this.remove(path);
    let entry = { name: path, timestamp: ++this.timestamp };
    this.index.push(entry);
    let fullPath = this.getFullPath(entry);
    let json = JSON.stringify(value);
    window.localStorage.setItem(fullPath, json);

    return true;
  }

  get(path: string): any {
    try {
      let entry = this.findEntry(path);
      if (!entry) {
        return null;
      }

      let fullPath = this.getFullPath(entry);
      let json = window.localStorage.getItem(fullPath);
      return JSON.parse(json, parseDate);
    } catch (e) {
      return null;
    }
  }

  getList(searchPattern?: string, limit?: number): IStorageItem[] {
    let entries = this.index;

    if (searchPattern) {
      let regex = new RegExp(searchPattern);
      entries = entries.filter(entry => regex.test(entry.name));
    }

    if (entries.length > this.maxItems) {
      entries = entries.slice(entries.length - this.maxItems);
    }

    if (entries.length > limit) {
      entries = entries.slice(0, limit);
    }

    let items = entries.map(e => this.loadEntry(e));
    return items;
  }

  remove(path: string): void {
    try {
      let entry = this.findEntry(path);
      if (!entry) {
        return null;
      }

      let fullPath = this.getFullPath(entry);
      window.localStorage.removeItem(fullPath);
      this.removeEntry(entry);
    } catch (e) { }
  }

  private loadEntry(entry: IndexEntry) {
    let fullPath = this.getFullPath(entry);
    let created = Date.now();
    let json = window.localStorage.getItem(fullPath);
    let value = JSON.parse(json, parseDate);
    return {
      created: created,
      path: entry.name,
      value
    };
  }

  private findEntry(path: string) {
    for (let i = this.index.length - 1; i >= 0; i--) {
      if (this.index[i].name === path) {
        return this.index[i];
      }
    }
    return null;
  }

  private removeEntry(entry: IndexEntry) {
    let i = this.index.indexOf(entry);
    if (i > -1) {
      this.index.splice(i, 1);
    }
  }

  private getFullPath(entry: IndexEntry) {
    let filename = this.prefix + entry.name + '__' + entry.timestamp;
    return filename;
  }

  private createIndex() {
    let regex = new RegExp('^' + regExEscape(this.prefix));
    let files = Object.keys(window.localStorage)
      .filter(f => regex.test(f))
      .map(f => f.substr(this.prefix.length));
    return files
      .map(file => {
        let parts = file.split('__');
        return {
          name: parts[0],
          timestamp: parseInt(parts[1], 10)
        };
      }).sort((a, b) => a.timestamp - b.timestamp);
  }
}

function regExEscape(value) {
  return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
}

function parseDate(key, value) {
  let dateRegx = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/g;
  if (typeof value === 'string') {
    let a = dateRegx.exec(value);
    if (a) {
      return new Date(value);
    }
  }
  return value;
};
