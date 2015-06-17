import { Configuration } from './Configuration';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { SettingsManager } from './SettingsManager';

describe('SettingsManager', () => {
  it('should call changed handler', (done) => {
    SettingsManager.onChanged((configuration:Configuration) => {
      expect(configuration.settings).toBeDefined();
      done();
    });
    
    var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    SettingsManager.applySavedServerSettings(config);
  }, 250);
});