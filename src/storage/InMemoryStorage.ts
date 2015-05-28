import { IEvent } from '../models/IEvent';
import { IStorage } from './IStorage';
import { IStorageItem } from './IStorageItem';

export class InMemoryStorage<T> implements IStorage<T> {
  private _items:IStorageItem<T>[] = [];
  private _maxItems:number;

  constructor(maxItems?:number) {
    this._maxItems = maxItems > 0 ? maxItems : 250;
  }

  public save(path:string, value:T):boolean {
    if (!path || !value) {
      return false;
    }

    if (this._items.push({ created: new Date().getTime(), path: path, value: value }) > this._maxItems) {
      this._items.shift();
    }

    return true;
  }

  public get(path:string):T {
    var item:IStorageItem<T> = path ? this.getList(path, 1)[0] : null;
    return item ? item.value : null;
  }

  public getList(searchPattern?:string, limit?:number):IStorageItem<T>[] {
    var items = this._items; // Optimization for minifier
    if (!searchPattern) {
      return items.slice(0, limit);
    }

    var regex = new RegExp(searchPattern);
    var results:IStorageItem<T>[] = [];
    for (var index = 0; index < items.length; index++) {
      if (regex.test(items[index].path)) {
        results.push(items[index]);

        if (results.length >= limit) {
          break;
        }
      }
    }

    return results;
  }

  public remove(path:string):void {
    if (path) {
      var item = this.getList(path, 1)[0];
      if (item) {
        this._items.splice(this._items.indexOf(item), 1);
      }
    }
  }
}
