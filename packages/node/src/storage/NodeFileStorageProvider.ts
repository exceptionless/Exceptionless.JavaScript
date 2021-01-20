import { IStorage } from '@exceptionless/core/storage/IStorage';
import { IStorageProvider } from '@exceptionless/core/storage/IStorageProvider';
import { NodeFileStorage } from './NodeFileStorage';

export class NodeFileStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(folder?: string, prefix?: string, maxQueueItems: number = 250) {
    this.queue = new NodeFileStorage('q', folder, prefix, maxQueueItems);
    this.settings = new NodeFileStorage('settings', folder, prefix, 1);
  }
}
