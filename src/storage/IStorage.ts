export interface IStorage<T>{
  save<T>(path:string, value:T):boolean;
  get(searchPattern?:string, limit?:number):T[];
  clear(searchPattern?:string):void;
  count(searchPattern?:string):number;
}
