import { Configuration } from './Configuration';
import { SettingsResponse } from '../submission/SettingsResponse';
import { Utils } from '../Utils';

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
  private static _handlers: { (config: Configuration): void }[] = [];

  public static onChanged(handler: (config: Configuration) => void) {
    !!handler && this._handlers.push(handler);
  }

  public static applySavedServerSettings(config: Configuration): void {
    let savedSettings = this.getSavedServerSettings(config);
    config.log.info('Applying saved settings.');
    config.settings = Utils.merge(config.settings, savedSettings.settings);
    this.changed(config);
  }

  public static checkVersion(version: number, config: Configuration): void {
    if (version) {
      let savedSettings = this.getSavedServerSettings(config);
      let savedVersion = savedSettings.version;
      if (version > savedVersion) {
        config.log.info(`Updating settings from v${savedVersion} to v${version}`);
        this.updateSettings(config);
      }
    }
  }

  public static updateSettings(config: Configuration): void {
    if (!config.isValid) {
      config.log.error('Unable to update settings: ApiKey is not set.');
      return;
    }

    config.submissionClient.getSettings(config, (response: SettingsResponse) => {
      if (!response || !response.success || !response.settings) {
        return;
      }

      config.settings = Utils.merge(config.settings, response.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      let savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (let key in savedServerSettings) {
        if (response.settings[key]) {
          continue;
        }

        delete config.settings[key];
      }

      let newSettings = <ISettingsWithVersion>{
        version: response.settingsVersion,
        settings: response.settings
      };

      config.storage.settings.save(newSettings);

      config.log.info('Updated settings');
      this.changed(config);
    });
  }

  private static changed(config: Configuration) {
    let handlers = this._handlers; // optimization for minifier.
    for (let index = 0; index < handlers.length; index++) {
      handlers[index](config);
    }
  }

  private static getSavedServerSettings(config: Configuration): ISettingsWithVersion {
    let item = config.storage.settings.get()[0];
    if (item && item.value && item.value.version && item.value.settings) {
      return item.value;
    }

    return { version: 0, settings: {} };
  }
}
