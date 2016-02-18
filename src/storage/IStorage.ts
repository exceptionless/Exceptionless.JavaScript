import { IStorageItem } from './IStorageItem';

export interface IStorage {
  save(value: any): number;
  get(limit?: number): IStorageItem[];
  remove(timestamp: number): void;
  clear(): void;
}
