import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

import * as Fs from 'fs';
import * as Path from 'path';

interface IndexEntry {
  name: string;
  timestamp: number;
}

export class NodeFileStorage implements IStorage {
  private directory: string;
  private maxItems: number;
  private timestamp: number;
  private index: IndexEntry[];
  private fs: any;

  constructor(folder: string, maxItems: number = 20, fs?: any) {
    this.directory = Path.resolve(folder);
    this.maxItems = maxItems;
    this.fs = fs ? fs : Fs;

    mkdirParent(this.directory);
    this.index = this.createIndex(this.directory);
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
    this.fs.writeFileSync(fullPath, json);

    return true;
  }

  get(path: string): any {
    try {
      let entry = this.findEntry(path);
      if (!entry) {
        return null;
      }

      let fullPath = this.getFullPath(entry);
      let json = this.fs.readFileSync(fullPath, 'utf8');
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
      this.fs.unlinkSync(fullPath);
      this.removeEntry(entry);
    } catch (e) { }
  }

  private loadEntry(entry: IndexEntry) {
    let fullPath = this.getFullPath(entry);
    let created = this.fs.statSync(fullPath).birthtime.getTime();
    let json = this.fs.readFileSync(fullPath, 'utf8');
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
    let filename = entry.name + '__' + entry.timestamp;
    return Path.join(this.directory, filename);
  }

  private createIndex(path: string) {
    let files = this.fs.readdirSync(path);
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

function mkdirParent(dirPath) {
  try {
    this.fs.mkdirSync(dirPath);
  } catch (e) {
    if (e.errno === 34) {
      mkdirParent(Path.dirname(dirPath));
      mkdirParent(dirPath);
    }
  }
}
