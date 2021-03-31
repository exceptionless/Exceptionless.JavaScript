import { ILog } from "../logging/ILog.js";
import { merge } from "../Utils.js";
import { Configuration } from "./Configuration.js";

export class ClientSettings {
  constructor(
    public settings: { [key: string]: string },
    public version: number
  ) { }
}

export class SettingsManager {
  private static _isUpdatingSettings: boolean = false;

  public static applySavedServerSettings(config: Configuration): void {
    if (!config?.isValid) {
      return;
    }

    const savedSettings = this.getSavedServerSettings(config);
    config.services.log.trace(`Applying saved settings: v${savedSettings.version}`);
    config.settings = merge(config.settings, savedSettings.settings);
  }

  public static getVersion(config: Configuration): number {
    if (!config?.isValid) {
      return 0;
    }

    const savedSettings = this.getSavedServerSettings(config);
    return savedSettings.version || 0;
  }

  public static async checkVersion(version: number, config: Configuration): Promise<void> {
    const currentVersion: number = this.getVersion(config);
    if (version <= currentVersion) {
      return;
    }

    config.services.log.info(`Updating settings from v${currentVersion} to v${version}`);
    await this.updateSettings(config, currentVersion);
  }

  public static async updateSettings(config: Configuration, version?: number): Promise<void> {
    if (!config?.enabled || this._isUpdatingSettings) {
      return;
    }

    const { log } = config.services;
    const unableToUpdateMessage = "Unable to update settings";
    if (!config.isValid) {
      log.error(`${unableToUpdateMessage}: ApiKey is not set`);
      return;
    }

    if (!version || version < 0) {
      version = this.getVersion(config);
    }

    log.trace(`Checking for updated settings from: v${version}`);
    this._isUpdatingSettings = true;
    const response = await config.services.submissionClient.getSettings(version);
    try {
      if (response.status === 304) {
        log.trace("Settings are up-to-date");
        return;
      }

      if (!response?.success || !response.data) {
        log.warn(`${unableToUpdateMessage}: ${response.message}`);
        return;
      }

      const data = JSON.parse(response.data);
      const settings = merge(config.settings, data.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      const savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (const key in savedServerSettings) {
        if (data.settings[key]) {
          continue;
        }

        delete settings[key];
      }

      config.settings = settings;
      config.services.storage.settings.save(response.data);
      log.trace(`Updated settings: v${data.version}`);
    } finally {
      this._isUpdatingSettings = false;
    }
  }

  private static getSavedServerSettings(config: Configuration): ClientSettings {
    const item = config.services.storage.settings.get()[0];
    if (item && item.value && item.value.version && item.value.settings) {
      return item.value;
    }

    return { version: 0, settings: {} };
  }
}
