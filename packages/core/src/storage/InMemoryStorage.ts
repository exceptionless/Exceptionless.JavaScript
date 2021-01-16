import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

export class InMemoryStorage implements IStorage {
  private maxItems: number;
  private items: IStorageItem[] = [];
  private lastTimestamp: number = 0;

  constructor(maxItems: number) {
    this.maxItems = maxItems;
  }

  public save(value: any): number {
    if (!value) {
      return null;
    }

    const items = this.items;
    const timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
    const item = { timestamp, value };

    if (items.push(item) > this.maxItems) {
      items.shift();
    }

    this.lastTimestamp = timestamp;
    return item.timestamp;
  }

  public get(limit?: number): IStorageItem[] {
    return this.items.slice(0, limit);
  }

  public remove(timestamp: number): void {
    const items = this.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].timestamp === timestamp) {
        items.splice(i, 1);
        return;
      }
    }
  }

  public clear(): void {
    this.items = [];
  }
}
