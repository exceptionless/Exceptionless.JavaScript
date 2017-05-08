import { SettingsResponse } from '../submission/SettingsResponse';
import { Utils } from '../Utils';
import { Configuration } from './Configuration';

interface ISettingsWithVersion {
  version: number;
  settings: { [key: string]: string };
}

export class SettingsManager {
  /**
   * A list of handlers that will be fired when the settings change.
   * @type {Array}
   * @private
   */
  private static _handlers: Array<(config: Configuration) => void> = [];

  public static onChanged(handler: (config: Configuration) => void) {
    !!handler && this._handlers.push(handler);
  }

  public static applySavedServerSettings(config: Configuration): void {
    if (!config || !config.isValid) {
      return;
    }

    const savedSettings = this.getSavedServerSettings(config);
    config.log.info(`Applying saved settings: v${savedSettings.version}`);
    config.settings = Utils.merge(config.settings, savedSettings.settings);
    this.changed(config);
  }

  public static getVersion(config: Configuration): number {
    if (!config || !config.isValid) {
      return 0;
    }

    const savedSettings = this.getSavedServerSettings(config);
    return savedSettings.version || 0;
  }

  public static checkVersion(version: number, config: Configuration): void {
    const currentVersion: number = this.getVersion(config);
    if (version <= currentVersion) {
      return;
    }

    config.log.info(`Updating settings from v${currentVersion} to v${version}`);
    this.updateSettings(config, currentVersion);
  }

  public static updateSettings(config: Configuration, version?: number): void {
    if (!config || !config.enabled) {
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
    config.submissionClient.getSettings(config, version, (response: SettingsResponse) => {
      if (!config || !response || !response.success || !response.settings) {
        config.log.warn(`${unableToUpdateMessage}: ${response.message}`);
        return;
      }

      config.settings = Utils.merge(config.settings, response.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      const savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (const key in savedServerSettings) {
        if (response.settings[key]) {
          continue;
        }

        delete config.settings[key];
      }

      const newSettings: ISettingsWithVersion = {
        version: response.settingsVersion,
        settings: response.settings
      };

      config.storage.settings.save(newSettings);

      config.log.info(`Updated settings: v${newSettings.version}`);
      this.changed(config);
    });
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

  private static getSavedServerSettings(config: Configuration): ISettingsWithVersion {
    const item = config.storage.settings.get()[0];
    if (item && item.value && item.value.version && item.value.settings) {
      return item.value;
    }

    return { version: 0, settings: {} };
  }
}
