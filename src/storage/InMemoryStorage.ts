import { IStorage } from './IStorage';

export class InMemoryStorage<T> implements IStorage<T> {
  private _items = {};

  public save<T>(path:string, value:T):boolean {
    this._items[path] = value;
    return true;
  }

  public get(path:string):T {
    return this._items[path] || null;
  }

  public getList(searchPattern?:string, limit?:number):{ path:string, value:T }[] {
    var regex = new RegExp(searchPattern || '.*');

    var results:{ path:string, value:T }[] = [];
    for (var key in this._items) {
      if (results.length >= limit) {
        break;
      }

      if (regex.test(key)) {
        results.push({ path: key, value: this._items[key] });
      }
    }

    return results;
  }

  public remove(path:string):void {
    if (path) {
      delete this._items[path];
    }
  }
}
