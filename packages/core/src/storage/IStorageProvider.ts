import { IStorage } from './IStorage';

export interface IStorageProvider {
  queue: IStorage;
  settings: IStorage;
}
