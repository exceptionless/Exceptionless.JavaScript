import { Configuration } from "./Configuration.js";

export class ServerSettings {
  constructor(
    public settings: Record<string, string>,
    public version: number
  ) { }
}

export class SettingsManager {
  private static readonly SettingsKey: string = "settings";
  private static _isUpdatingSettings = false;

  public static async applySavedServerSettings(config: Configuration): Promise<void> {
    if (!config?.isValid) {
      return;
    }

    const savedSettings = await this.getSavedServerSettings(config);
    if (savedSettings) {
      config.applyServerSettings(savedSettings);
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

      config.applyServerSettings(response.data);

      await config.services.storage.setItem(SettingsManager.SettingsKey, JSON.stringify(response.data));
      log.trace(`Updated settings: v${response.data.version}`);
    } catch (ex) {
      log.error(`Error updating settings: ${ex instanceof Error ? ex.message : ex + ''}`);
    } finally {
      this._isUpdatingSettings = false;
    }
  }

  private static async getSavedServerSettings(config: Configuration): Promise<ServerSettings> {
    try {
      const settings = await config.services.storage.getItem(SettingsManager.SettingsKey);
      return settings && JSON.parse(settings) as ServerSettings || new ServerSettings({}, 0);
    } catch {
      return new ServerSettings({}, 0);
    }
  }
}
