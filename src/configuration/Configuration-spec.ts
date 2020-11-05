import { expect } from 'chai';
import { describe, it } from 'mocha';
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
    expect(config.includePrivateInformation).to.true;
    expect(config.includeUserName).to.true;
    expect(config.includeMachineName).to.true;
    expect(config.includeIpAddress).to.true;
    expect(config.includeCookies).to.true;
    expect(config.includePostData).to.true;
    expect(config.includeQueryString).to.true;

    config = new Configuration({ includePrivateInformation: false });
    expect(config.includePrivateInformation).to.false;
    expect(config.includeUserName).to.false;
    expect(config.includeMachineName).to.false;
    expect(config.includeIpAddress).to.false;
    expect(config.includeCookies).to.false;
    expect(config.includePostData).to.false;
    expect(config.includeQueryString).to.false;

    config.includeMachineName = true;
    expect(config.includePrivateInformation).to.false;
    expect(config.includeUserName).to.false;
    expect(config.includeMachineName).to.true;
    expect(config.includeIpAddress).to.false;
    expect(config.includeCookies).to.false;
    expect(config.includePostData).to.false;
    expect(config.includeQueryString).to.false;
  });

  it('should not add duplicate plugin', () => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.plugins).not.to.equal(null);
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin('test', 20, () => { });
    config.addPlugin('test', 20, () => { });
    expect(config.plugins.length).to.equal(1);
  });

  it('should generate plugin name and priority', () => {
    const config = new Configuration({ apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl: 'http://localhost:50000' });
    expect(config.plugins).not.to.equal(null);
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin(null, null, () => { });
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

    config.addPlugin('3', 3, () => { });
    config.addPlugin('1', 1, () => { });
    config.addPlugin('2', 2, () => { });
    expect(config.plugins.length).to.equal(3);
    expect(config.plugins[0].priority).to.equal(1);
    expect(config.plugins[1].priority).to.equal(2);
    expect(config.plugins[2].priority).to.equal(3);
  });
});
