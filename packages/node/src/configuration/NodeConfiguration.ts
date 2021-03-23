import { Configuration, SettingsManager } from "@exceptionless/core";
import { NodeFileStorageProvider } from "../storage/NodeFileStorageProvider.js";

export class NodeConfiguration extends Configuration {
  public useLocalStorage(folder?: string): void {
    this.services.storage = new NodeFileStorageProvider(folder);
    SettingsManager.applySavedServerSettings(this);
  }
}
