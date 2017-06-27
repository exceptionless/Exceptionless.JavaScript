import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

export abstract class KeyValueStorageBase implements IStorage {
  private maxItems: number;
  private items: number[];
  private lastTimestamp: number = 0;

  constructor(maxItems) {
    this.maxItems = maxItems;
  }

  public save(value: any, single?: boolean): number {
    if (!value) {
      return null;
    }

    this.ensureIndex();

    const items = this.items;
    const timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
    const key = this.getKey(timestamp);
    const json = JSON.stringify(value);

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

  public get(limit?: number): IStorageItem[] {
    this.ensureIndex();

    return this.items.slice(0, limit)
      .map((timestamp) => {
        // Read and parse item for this timestamp
        const key = this.getKey(timestamp);
        try {
          const json = this.read(key);
          const value = JSON.parse(json, parseDate);
          return { timestamp, value };
        } catch (error) {
          // Something went wrong - try to delete the cause.
          this.safeDelete(key);
          return null;
        }
      })
      .filter((item) => item != null);
  }

  public remove(timestamp: number): void {
    this.ensureIndex();

    const items = this.items;
    const index = items.indexOf(timestamp);
    if (index >= 0) {
      const key = this.getKey(timestamp);
      this.safeDelete(key);
      items.splice(index, 1);
    }
  }

  public clear(): void {
    this.items.forEach((item) => this.safeDelete(this.getKey(item)));
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
      const keys = this.readAllKeys();
      return keys.map((key) => {
        try {
          const timestamp = this.getTimestamp(key);
          if (!timestamp) {
            this.safeDelete(key);
            return null;
          }
          return timestamp;
        } catch (error) {
          this.safeDelete(key);
          return null;
        }
      }).filter((timestamp) => timestamp != null)
        .sort((a, b) => a - b);
    } catch (error) {
      return [];
    }
  }
}

function parseDate(key, value) {
  const dateRegx = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/g;
  if (typeof value === 'string') {
    const a = dateRegx.exec(value);
    if (a) {
      return new Date(value);
    }
  }
  return value;
}
