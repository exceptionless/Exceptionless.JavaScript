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
  private static readonly SETTINGS_FILE_NAME: string = "settings.json";
  private static _isUpdatingSettings: boolean = false;

  public static async applySavedServerSettings(config: Configuration): Promise<void> {
    if (!config?.isValid) {
      return;
    }

    const savedSettings = await this.getSavedServerSettings(config);
    config.services.log.trace(`Applying saved settings: v${savedSettings.version}`);
    config.settings = merge(config.settings, savedSettings.settings);
  }

  public static async getVersion(config: Configuration): Promise<number> {
    if (!config?.isValid) {
      return 0;
    }

    const savedSettings = await this.getSavedServerSettings(config);
    return savedSettings.version || 0;
  }

  public static async checkVersion(version: number, config: Configuration): Promise<void> {
    const currentVersion: number = await this.getVersion(config);
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
      version = await this.getVersion(config);
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
      const savedServerSettings = await SettingsManager.getSavedServerSettings(config);
      for (const key in savedServerSettings) {
        if (data.settings[key]) {
          continue;
        }

        delete settings[key];
      }

      config.settings = settings;
      await config.services.storage.setItem(SettingsManager.SETTINGS_FILE_NAME, data);
      log.trace(`Updated settings: v${data.version}`);
    } finally {
      this._isUpdatingSettings = false;
    }
  }

  private static async getSavedServerSettings(config: Configuration): Promise<ClientSettings> {
    const settings = await config.services.storage.getItem(SettingsManager.SETTINGS_FILE_NAME);
    if (settings) {
      return JSON.parse(settings) as ClientSettings;
    }

    return { version: 0, settings: {} };
  }
}
