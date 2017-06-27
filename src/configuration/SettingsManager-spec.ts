import { expect } from 'chai';
import { Configuration } from './Configuration';
import { SettingsManager } from './SettingsManager';

describe('SettingsManager', () => {
  it('should call changed handler', (done) => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw' });

    SettingsManager.onChanged((configuration: Configuration) => {
      expect(configuration.settings).not.to.be.undefined;
      done();
    });

    SettingsManager.applySavedServerSettings(config);
    (SettingsManager as any)._handlers = [];
  });
});
