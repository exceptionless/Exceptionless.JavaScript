import Configuration from './Configuration';
import { EventPluginContext } from '../plugins/EventPluginContext';

describe('Configuration', () => {
  it('should set the api key to null and enabled to false', () => {
    var config = new Configuration(null);
    expect(config.apiKey).toBe(null);
    expect(config.enabled).toBe(false);
  });

  it('should set the api key and enabled to true', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config).not.toBe(null);
    expect(config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(config.enabled).toBe(true);
  });

  it('should override configuration defaults', () => {
    var config = new Configuration();
    expect(config.apiKey).toBe(null);
    expect(config.enabled).toBe(false);

    Configuration.defaults.apiKey = 'test';
    config = new Configuration();
    expect(config.apiKey).toBe('test');
    expect(config.enabled).toBe(true);

    config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(config.enabled).toBe(true);

    config = new Configuration({ apiKey:null });
    expect(config.apiKey).toBe('test');
    expect(config.enabled).toBe(true);

    delete Configuration.defaults.apiKey;
    var config = new Configuration();
    expect(config.apiKey).toBe(null);
    expect(config.enabled).toBe(false);
  });

  it('apply client configuration', () => {
    var config = new Configuration(null);
    expect(config.apiKey).toBe(null);
    expect(config.enabled).toBe(false);

    config.apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
    expect(config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(config.enabled).toBe(true);
  });

  it('should not add duplicate plugin', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.plugins).not.toBe(null);
    while(config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin('test', 20, (context:EventPluginContext) => {});
    config.addPlugin('test', 20, (context:EventPluginContext) => {});
    expect(config.plugins.length).toBe(1);
  });

  it('should generate plugin name and priority', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.plugins).not.toBe(null);
    while(config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin(null, null, (context:EventPluginContext) => {});
    expect(config.plugins.length).toBe(1);
    expect(config.plugins[0].name).not.toBe(null);
    expect(config.plugins[0].priority).toBe(0);
  });

  it('should sort plugins by priority', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.plugins).not.toBe(null);
    while(config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin('3', 3, (context:EventPluginContext) => {});
    config.addPlugin('1', 1, (context:EventPluginContext) => {});
    config.addPlugin('2', 2, (context:EventPluginContext) => {});
    expect(config.plugins.length).toBe(3);
    expect(config.plugins[0].priority).toBe(1);
    expect(config.plugins[1].priority).toBe(2);
    expect(config.plugins[2].priority).toBe(3);
  });
});
