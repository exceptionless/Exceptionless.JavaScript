/// <reference path="../references.ts" />

module Exceptionless {
  export interface IStorage<T>{
    save<T>(path:string, value:T): boolean;
    get(searchPattern?:string, limit?:number): T[];
    clear(searchPattern?:string);
    count(searchPattern?:string): number;
  }
}
