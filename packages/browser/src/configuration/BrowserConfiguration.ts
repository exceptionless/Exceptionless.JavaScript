import { Configuration, SettingsManager } from "@exceptionless/core";
import { BrowserLocalStorage } from "../storage/BrowserLocalStorage.js";
import { BrowserLocalStorageProvider } from "../storage/BrowserLocalStorageProvider.js";

export class BrowserConfiguration extends Configuration {
  public useLocalStorage(): void {
    if (BrowserLocalStorage.isAvailable()) {
      this.services.storage = new BrowserLocalStorageProvider();
      SettingsManager.applySavedServerSettings(this);
    }
  }
}
