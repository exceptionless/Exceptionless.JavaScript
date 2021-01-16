import { InMemoryStorage } from './InMemoryStorage';
import { IStorage } from './IStorage';
import { IStorageProvider } from './IStorageProvider';

export class InMemoryStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(maxQueueItems: number = 250) {
    this.queue = new InMemoryStorage(maxQueueItems);
    this.settings = new InMemoryStorage(1);
  }

}
