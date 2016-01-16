import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

export class InMemoryStorage implements IStorage {
  private _items: IStorageItem[] = [];
  private _maxItems: number;

  constructor(maxItems?: number) {
    this._maxItems = maxItems > 0 ? maxItems : 250;
  }

  public save(path: string, value: any): boolean {
    if (!path || !value) {
      return false;
    }

    this.remove(path);
    if (this._items.push({ created: new Date().getTime(), path: path, value: value }) > this._maxItems) {
      this._items.shift();
    }

    return true;
  }

  public get(path: string): any {
    let item: IStorageItem = path ? this.getList(`^${path}$`, 1)[0] : null;
    return item ? item.value : null;
  }

  public getList(searchPattern?: string, limit?: number): IStorageItem[] {
    let items = this._items; // Optimization for minifier
    if (!searchPattern) {
      return items.slice(0, limit);
    }

    let regex = new RegExp(searchPattern);
    let results: IStorageItem[] = [];
    for (let index = 0; index < items.length; index++) {
      if (regex.test(items[index].path)) {
        results.push(items[index]);

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }

  public remove(path: string): void {
    if (path) {
      let item = this.getList(`^${path}$`, 1)[0];
      if (item) {
        this._items.splice(this._items.indexOf(item), 1);
      }
    }
  }
}
