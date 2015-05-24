export interface IStorage<T>{
  save<T>(path:string, value:T):boolean;
  get(path:string):T;
  getList(searchPattern?:string, limit?:number):{ path:string, value:T }[];
  remove(path:string):void;
}
