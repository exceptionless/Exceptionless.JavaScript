import {
  IStorage,
  IStorageProvider
} from "@exceptionless/core";

import { NodeFileStorage } from "./NodeFileStorage.js";

export class NodeFileStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(folder?: string, maxQueueItems: number = 250) {
    this.queue = new NodeFileStorage("q", folder, maxQueueItems);
    this.settings = new NodeFileStorage("settings", folder, 1);
  }
}
