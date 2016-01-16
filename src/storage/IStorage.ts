import { IStorageItem } from './IStorageItem';

export interface IStorage {
  save(path: string, value: any): boolean;
  get(path: string): any;
  getList(searchPattern?: string, limit?: number): IStorageItem[];
  remove(path: string): void;
}
