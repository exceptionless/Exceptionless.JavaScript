import { BrowserStorage } from './BrowserStorage';
import { IStorage } from '../../../core/src/storage/IStorage';
import { IStorageProvider } from '../../../core/src/storage/IStorageProvider';

export class BrowserStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(prefix?: string, maxQueueItems: number = 250) {
    this.queue = new BrowserStorage('q', prefix, maxQueueItems);
    this.settings = new BrowserStorage('settings', prefix, 1);
  }

}
