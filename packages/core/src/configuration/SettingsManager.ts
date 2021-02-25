import { merge } from "../Utils.js";
import { Configuration } from './Configuration.js';

export class ClientSettings {
  constructor(
    public settings: { [key: string]: string },
    public version: number
  ) { }
}

export class SettingsManager {
  private static _isUpdatingSettings: boolean = false;

  /**
   * A list of handlers that will be fired when the settings change.
   * @type {Array}
   * @private
   */
  private static _handlers: Array<(config: Configuration) => void> = [];

  // TODO: see if this is still needed.
  public static onChanged(handler: (config: Configuration) => void): void {
    handler && this._handlers.push(handler);
  }

  public static applySavedServerSettings(config: Configuration): void {
    if (!config || !config.isValid) {
      return;
    }

    const savedSettings = this.getSavedServerSettings(config);
    config.log.info(`Applying saved settings: v${savedSettings.version}`);
    config.settings = merge(config.settings, savedSettings.settings);
    this.changed(config);
  }

  public static getVersion(config: Configuration): number {
    if (!config || !config.isValid) {
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

    config.log.info(`Updating settings from v${currentVersion} to v${version}`);
    await this.updateSettings(config, currentVersion);
  }

  public static async updateSettings(config: Configuration, version?: number): Promise<void> {
    if (!config || !config.enabled || this._isUpdatingSettings) {
      return;
    }

    const unableToUpdateMessage = 'Unable to update settings';
    if (!config.isValid) {
      config.log.error(`${unableToUpdateMessage}: ApiKey is not set.`);
      return;
    }

    if (!version || version < 0) {
      version = this.getVersion(config);
    }

    config.log.info(`Checking for updated settings from: v${version}.`);
    this._isUpdatingSettings = true;
    const response = await config.submissionClient.getSettings(version);
    try {
      if (!config || !response || !response.success || !response.data) {
        config.log.warn(`${unableToUpdateMessage}: ${response.message}`);
        return;
      }

      config.settings = merge(config.settings, response.data.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      const savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (const key in savedServerSettings) {
        if (response.data.settings[key]) {
          continue;
        }

        delete config.settings[key];
      }

      config.storage.settings.save(response.data);
      config.log.info(`Updated settings: v${response.data.version}`);
      this.changed(config);
    } finally {
      this._isUpdatingSettings = false;
    }
  }

  private static changed(config: Configuration) {
    const handlers = this._handlers; // optimization for minifier.
    for (const handler of handlers) {
      try {
        handler(config);
      } catch (ex) {
        config.log.error(`Error calling onChanged handler: ${ex}`);
      }
    }
  }

  private static getSavedServerSettings(config: Configuration): ClientSettings {
    const item = config.storage.settings.get()[0];
    if (item && item.value && item.value.version && item.value.settings) {
      return item.value;
    }

    return { version: 0, settings: {} };
  }
}
