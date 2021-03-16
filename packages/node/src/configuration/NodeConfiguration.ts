import { Configuration, SettingsManager } from "@exceptionless/core";
import { NodeFileStorageProvider } from "../storage/NodeFileStorageProvider.js";

export class NodeConfiguration extends Configuration {
  public useLocalStorage(folder?: string): void {
    // TODO: This should be using the first x chars of the api key for the prefix.
    this.storage = new NodeFileStorageProvider(folder);
    SettingsManager.applySavedServerSettings(this);
    this.changed();
  }
}
