import {
  IStorage,
  IStorageProvider
} from "@exceptionless/core";

import { NodeFileStorage } from "./NodeFileStorage.js";

export class NodeFileStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(folder?: string, prefix?: string, maxQueueItems: number = 250) {
    this.queue = new NodeFileStorage("q", folder, prefix, maxQueueItems);
    this.settings = new NodeFileStorage("settings", folder, prefix, 1);
  }
}
