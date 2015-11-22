import { IStorageItem } from './IStorageItem';

export interface IStorage<T> {
  save(path: string, value: T): boolean;
  get(path: string): T;
  getList(searchPattern?: string, limit?: number): IStorageItem<T>[];
  remove(path: string): void;
}
