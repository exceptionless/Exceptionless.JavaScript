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
    if (savedSettings) {
      config.services.log.trace(`Applying saved settings: v${savedSettings.version}`);
      config.settings = merge(config.settings, savedSettings.settings);
      config.settingsVersion = savedSettings.version;
    }
  }

  public static async updateSettings(config: Configuration): Promise<void> {
    if (!config?.enabled || this._isUpdatingSettings) {
      return;
    }

    this._isUpdatingSettings = true;
    const { log } = config.services;
    try {

      const unableToUpdateMessage = "Unable to update settings";
      if (!config.isValid) {
        log.error(`${unableToUpdateMessage}: ApiKey is not set`);
        return;
      }

      const version = config.settingsVersion;
      log.trace(`Checking for updated settings from: v${version}`);
      const response = await config.services.submissionClient.getSettings(version);

      if (response.status === 304) {
        log.trace("Settings are up-to-date");
        return;
      }

      if (!response?.success || !response.data) {
        log.warn(`${unableToUpdateMessage}: ${response.message}`);
        return;
      }

      const data: ClientSettings = JSON.parse(response.data);
      log.info(`Updating settings from v${version} to v${data.version}`);
      const settings = merge(config.settings, data.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      const savedServerSettings = await SettingsManager.getSavedServerSettings(config);
      for (const key in savedServerSettings || {}) {
        if (data.settings[key]) {
          continue;
        }

        delete settings[key];
      }

      config.settings = settings;
      config.settingsVersion = data.version;
      await config.services.storage.setItem(SettingsManager.SETTINGS_FILE_NAME, response.data);
      log.trace(`Updated settings: v${data.version}`);
    } catch (ex) {
      log.error(`Error updating settings: ${ex.message}`);
    } finally {
      this._isUpdatingSettings = false;
    }
  }

  private static async getSavedServerSettings(config: Configuration): Promise<ClientSettings> {
    try {
      const settings = await config.services.storage.getItem(SettingsManager.SETTINGS_FILE_NAME);
      return settings && JSON.parse(settings) as ClientSettings;
    } catch {
      return null;
    }
  }
}
