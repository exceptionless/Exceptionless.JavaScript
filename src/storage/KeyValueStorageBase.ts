import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

export abstract class KeyValueStorageBase implements IStorage {
  private maxItems: number;
  private items: number[] = [];
  private lastTimestamp: number;

  constructor(maxItems) {
    this.maxItems = maxItems;
  }

  save(value: any, single?: boolean): number {
    if (!value) {
      return null;
    }

    this.ensureIndex();

    let items = this.items;
    let timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
    let key = this.getKey(timestamp);
    let json = JSON.stringify(value);

    try {
      this.write(key, json);
      this.lastTimestamp = timestamp;
      if (items.push(timestamp) > this.maxItems) {
        this.delete(this.getKey(items.shift()));
      }
    } catch (e) {
      return null;
    }

    return timestamp;
  }

  get(limit: number = 1): IStorageItem[] {
    this.ensureIndex();

    return this.items.slice(0, limit)
      .map(timestamp => {
        // Read and parse item for this timestamp
        let key = this.getKey(timestamp);
        try {
          let json = this.read(key);
          let value = JSON.parse(json, parseDate);
          return { timestamp, value };
        } catch (error) {
          // Something went wrong - try to delete the cause.
          this.safeDelete(key);
          return null;
        }
      })
      .filter(item => item != null);
  }

  remove(timestamp: number): void {
    this.ensureIndex();

    let items = this.items;
    let index = items.indexOf(timestamp);
    if (index >= 0) {
      let key = this.getKey(timestamp);
      this.safeDelete(key);
      items.splice(index, 1);
    };
  }

  clear(): void {
    this.items.forEach(item => this.safeDelete(this.getKey(item)));
    this.items = [];
  }

  protected abstract write(key: string, value: string): void;
  protected abstract read(key: string): string;
  protected abstract readAllKeys(): string[];
  protected abstract delete(key: string);
  protected abstract getKey(timestamp: number): string;
  protected abstract getTimestamp(key: string): number;

  private ensureIndex() {
    if (!this.items) {
      this.items = this.createIndex();
      this.lastTimestamp = Math.max(0, ...this.items) + 1;
    }
  }

  private safeDelete(key: string): void {
    try {
      this.delete(key);
    } catch (error) {
    }
  }

  private createIndex() {
    try {
      let keys = this.readAllKeys();
      return keys.map(key => {
        try {
          return this.getTimestamp(key);
        } catch (error) {
          this.safeDelete(key);
          return null;
        }
      }).filter(timestamp => timestamp != null)
        .sort((a, b) => a - b);
    } catch (error) {
      return [];
    }
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