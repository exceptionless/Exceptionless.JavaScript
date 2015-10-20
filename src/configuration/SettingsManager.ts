import { Configuration } from './Configuration';
import { SettingsResponse } from '../submission/SettingsResponse';
import { Utils } from '../Utils';

export class SettingsManager {
  /**
   * The configuration settings path.
   * @type {string}
   * @private
   */
  private static _configPath:string = 'ex-server-settings.json';

  /**
   * A list of handlers that will be fired when the settings change.
   * @type {Array}
   * @private
   */
  private static _handlers:{ (config:Configuration):void }[] = [];

  public static onChanged(handler:(config:Configuration) => void) {
    !!handler && this._handlers.push(handler);
  }

  public static applySavedServerSettings(config:Configuration):void {
    config.log.info('Applying saved settings.');
    config.settings = Utils.merge(config.settings, this.getSavedServerSettings(config));
    this.changed(config);
  }

  public static checkVersion(version:number, config:Configuration):void {
    if (version) {
      let savedConfigVersion = parseInt(<string>config.storage.get(`${this._configPath}-version`), 10);
      if (isNaN(savedConfigVersion) || version > savedConfigVersion) {
        config.log.info(`Updating settings from v${(!isNaN(savedConfigVersion) ? savedConfigVersion : 0)} to v${version}`);
        this.updateSettings(config);
      }
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
      let savedServerSettings = SettingsManager.getSavedServerSettings(config);
      for (let key in savedServerSettings) {
        if (response.settings[key]) {
          continue;
        }

        delete config.settings[key];
      }

      let path = SettingsManager._configPath; // optimization for minifier.
      config.storage.save(`${path}-version`, response.settingsVersion);
      config.storage.save(path, response.settings);

      config.log.info('Updated settings');
      this.changed(config);
    });
  }

  private static changed(config:Configuration) {
    let handlers = this._handlers; // optimization for minifier.
    for (let index = 0; index < handlers.length; index++) {
      handlers[index](config);
    }
  }

  private static getSavedServerSettings(config:Configuration):Object {
    return config.storage.get(this._configPath) || {};
  }
}
