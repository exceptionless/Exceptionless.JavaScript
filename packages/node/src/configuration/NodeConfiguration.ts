import { Configuration, SettingsManager } from "@exceptionless/core";
import { NodeFileStorageProvider } from "../storage/NodeFileStorageProvider.js";

export class NodeConfiguration extends Configuration {
  public useLocalStorage(): void {
    this.storage = new NodeFileStorageProvider();
    SettingsManager.applySavedServerSettings(this);
    this.changed();
  }
}
