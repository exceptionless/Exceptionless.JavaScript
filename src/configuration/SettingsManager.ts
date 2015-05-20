import { Configuration } from 'Configuration';
import { SettingsResponse } from '../submission/SettingsResponse';
import { Utils } from '../Utils';

export class SettingsManager {
  private static _configPath:string = 'ex-server-settings.json';

  public static applySavedServerSettings(config:Configuration):void {
    config.settings = Utils.merge(config.settings, this.getSavedServerSettings(config));
    config.log.info('Applying saved settings.');
    // TODO: Fire on changed event.
  }

  private static getSavedServerSettings(config:Configuration):Object {
    return config.storage.get(this._configPath, 1)[0] || {};
  }

  public static checkVersion(version:number, config:Configuration):void {
    if (isNaN(version) || version <= 0) {
      return;
    }

    var savedConfigVersion = parseInt(<string>config.storage.get(`${this._configPath}-version`, 1)[0]);
    if (isNaN(savedConfigVersion) || version > savedConfigVersion) {
      config.log.info(`Updating settings from v${(!isNaN(savedConfigVersion) ? savedConfigVersion : 0)} to v${version}`);
      this.updateSettings(config);
    }
  }

  public static updateSettings(config:Configuration):void {
    if (!config.isValid) {
      config.log.error('Unable to update settings: ApiKey is not set.');
      return;
    }

    config.submissionClient.getSettings(config, (response:SettingsResponse) => {
      if (!response || !response.success || !response.settings) {
        return;
      }

      config.settings = Utils.merge(config.settings, response.settings);

      // TODO: Store snapshot of settings after reading from config and attributes and use that to revert to defaults.
      // Remove any existing server settings that are not in the new server settings.
      var savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (var key in savedServerSettings) {
        if (response.settings[key]) {
          continue;
        }

        delete config.settings[key];
      }

      config.storage.save(`${this._configPath}-version`, response.settingsVersion);
      config.storage.save(this._configPath, response.settings);

      config.log.info('Updated settings');
      // TODO: Fire on changed event.
    });
  }
}
