import { IStorage } from "./IStorage.js";

export interface IStorageProvider {
  queue: IStorage;
  settings: IStorage;
}
