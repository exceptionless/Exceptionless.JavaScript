import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Configuration } from '../../src/configuration/Configuration';
import { SettingsManager } from '../../src/configuration/SettingsManager';

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
