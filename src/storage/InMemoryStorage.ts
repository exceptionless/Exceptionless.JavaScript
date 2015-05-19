import { IStorage } from './IStorage';

export class InMemoryStorage<T> implements IStorage<T> {
  private _items = {};

  public save<T>(path:string, value:T):boolean {
    this._items[path] = value;
    return true;
  }

  public get(searchPattern?:string, limit?:number):T[] {
    var results:T[] = [];
    var regex = new RegExp(searchPattern || '.*');

    for (var key in this._items) {
      if (results.length >= limit) {
        break;
      }

      if (regex.test(key)) {
        results.push(this._items[key]);
        delete this._items[key];
      }
    }

    return results;
  }

  public clear(searchPattern?:string):void {
    if (!searchPattern) {
      this._items = {};
      return;
    }

    var regex = new RegExp(searchPattern);
    for (var key in this._items) {
      if (regex.test(key)) {
        delete this._items[key];
      }
    }
  }

  public count(searchPattern?:string):number {
    var regex = new RegExp(searchPattern || '.*');
    var results:T[] = [];
    for (var key in this._items) {
      if (regex.test(key)) {
        results.push(key);
      }
    }

    return results.length;
  }
}
