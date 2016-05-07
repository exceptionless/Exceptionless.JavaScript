import { Configuration } from '../../configuration/Configuration';
import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { SettingsManager } from '../../configuration/SettingsManager';

export class UpdateConfigurationSettingsWhileIdlePlugin implements IEventPlugin {
  public priority: number = 1020;
  public name: string = 'UpdateConfigurationSettingsWhileIdlePlugin';

  private _config: Configuration;
  private _interval: number;
  private _intervalId: any;

  constructor (config: Configuration, interval: number = 1500000) {
    this._config = config;
    this._interval = interval;
    this._intervalId = setInterval(() => SettingsManager.updateSettings(this._config), 5000);
  }

  public run(context: EventPluginContext, next?: () => void): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }

    this._intervalId = setInterval(() => SettingsManager.updateSettings(this._config), this._interval);

    next && next();
  }
}
