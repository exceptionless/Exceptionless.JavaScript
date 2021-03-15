import {
  IStorage,
  IStorageProvider
} from "@exceptionless/core";

import { BrowserLocalStorage } from "./BrowserLocalStorage.js";

export class BrowserLocalStorageProvider implements IStorageProvider {
  public queue: IStorage;
  public settings: IStorage;

  constructor(prefix?: string, maxQueueItems: number = 250) {
    this.queue = new BrowserLocalStorage("q", prefix, maxQueueItems);
    this.settings = new BrowserLocalStorage("settings", prefix, 1);
  }
}
