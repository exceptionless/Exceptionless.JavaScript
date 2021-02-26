import { InMemoryStorage } from "./InMemoryStorage.js";
import { IStorage } from "./IStorage.js";
import { IStorageProvider } from "./IStorageProvider.js";

export class InMemoryStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(maxQueueItems: number = 250) {
    this.queue = new InMemoryStorage(maxQueueItems);
    this.settings = new InMemoryStorage(1);
  }
}
