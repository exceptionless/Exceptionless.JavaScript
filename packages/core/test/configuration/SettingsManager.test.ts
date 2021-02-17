import { Configuration } from '../../src/configuration/Configuration';
import { SettingsManager } from "../../src/configuration/SettingsManager";

describe('SettingsManager', () => {
  test('should call changed handler', (done) => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw' });

    SettingsManager.onChanged((configuration: Configuration) => {
      expect(configuration.settings).not.toBeUndefined();
      done();
    });

    SettingsManager.applySavedServerSettings(config);
    (SettingsManager as any)._handlers = [];
  });
});
