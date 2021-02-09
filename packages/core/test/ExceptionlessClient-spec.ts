import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { SinonFakeXMLHttpRequestStatic, useFakeXMLHttpRequest } from 'sinon';
import { Configuration } from "@exceptionless/core/configuration/Configuration";
import { ExceptionlessClient } from '@exceptionless/core/ExceptionlessClient';
import { EventPluginContext } from '@exceptionless/core/plugins/EventPluginContext';

describe('ExceptionlessClient', () => {
  let xhr: SinonFakeXMLHttpRequestStatic;

  beforeEach(() => {
    Configuration.defaults.updateSettingsWhenIdleInterval = -1;
    xhr = useFakeXMLHttpRequest();
  });

  afterEach(() => {
    xhr.restore();
  });

  it('should use event reference ids', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    expect(client.config.lastReferenceIdManager.getLast()).to.be.null;

    const error = createException();
    client.submitException(error, () => {
      expect(client.config.lastReferenceIdManager.getLast()).to.be.null;
    });

    const numberOfPlugins = client.config.plugins.length;
    client.config.useReferenceIds();
    expect(client.config.plugins.length).to.equal(numberOfPlugins + 1);

    client.submitException(error, (context: EventPluginContext) => {
      if (!context.cancelled) {
        expect(client.config.lastReferenceIdManager.getLast()).not.to.be.null;
      } else {
        expect(client.config.lastReferenceIdManager.getLast()).to.be.null;
      }

      done();
      done = () => { };
    });
  });

  it('should accept null source', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const builder = client.createLog(null, 'Unit Test message', 'Trace');

    expect(builder.target.source).to.be.undefined;
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data['@level']).to.equal('Trace');
  });

  it('should accept source and message', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const builder = client.createLog('ExceptionlessClient', 'Unit Test message');

    expect(builder.target.source).to.equal('ExceptionlessClient');
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data).to.be.undefined;
  });

  it('should accept source and message and level', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const builder = client.createLog('source', 'Unit Test message', 'Info');

    expect(builder.target.source).to.equal('source');
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data['@level']).to.equal('Info');
  });

  it('should allow construction via apiKey and serverUrl parameters', () => {
    const client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:5000');

    expect(client.config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(client.config.serverUrl).to.equal('http://localhost:5000');
  });

  it('should allow construction via a configuration object', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    expect(client.config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(client.config.serverUrl).to.equal('http://localhost:5000');
  });

  function createException() {
    function throwError() {
      throw new ReferenceError('This is a test');
    }
    try {
      throwError();
    } catch (e) {
      return e;
    }
  }
});
