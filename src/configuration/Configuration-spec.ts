import { expect } from 'chai';
import { EventPluginContext } from '../plugins/EventPluginContext';
import { Configuration } from './Configuration';

describe('Configuration', () => {
  it('should override configuration defaults', () => {
    let config = new Configuration();
    expect(config.apiKey).to.equal(null);

    config.apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
    expect(config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');

    Configuration.defaults.apiKey = 'test';
    config = new Configuration();
    expect(config.apiKey).to.equal('test');

    config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');

    config = new Configuration({ apiKey: null });
    expect(config.apiKey).to.equal('test');
  });

  it('should not add duplicate plugin', () => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.plugins).not.to.equal(null);
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin('test', 20, (context: EventPluginContext) => { });
    config.addPlugin('test', 20, (context: EventPluginContext) => { });
    expect(config.plugins.length).to.equal(1);
  });

  it('should generate plugin name and priority', () => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.plugins).not.to.equal(null);
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin(null, null, (context: EventPluginContext) => { });
    expect(config.plugins.length).to.equal(1);
    expect(config.plugins[0].name).not.to.equal(null);
    expect(config.plugins[0].priority).to.equal(0);
  });

  it('should sort plugins by priority', () => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.plugins).not.to.equal(null);
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin('3', 3, (context: EventPluginContext) => { });
    config.addPlugin('1', 1, (context: EventPluginContext) => { });
    config.addPlugin('2', 2, (context: EventPluginContext) => { });
    expect(config.plugins.length).to.equal(3);
    expect(config.plugins[0].priority).to.equal(1);
    expect(config.plugins[1].priority).to.equal(2);
    expect(config.plugins[2].priority).to.equal(3);
  });
});
