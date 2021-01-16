import { IStorage } from './IStorage';
import { IStorageProvider } from './IStorageProvider';
import { NodeFileStorage } from './NodeFileStorage';

export class NodeFileStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(folder?: string, prefix?: string, maxQueueItems: number = 250) {
    this.queue = new NodeFileStorage('q', folder, prefix, maxQueueItems);
    this.settings = new NodeFileStorage('settings', folder, prefix, 1);
  }
}
