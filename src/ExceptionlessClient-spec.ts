import { ExceptionlessClient } from './ExceptionlessClient';
import { EventPluginContext } from './plugins/EventPluginContext';
import { expect } from 'chai';
import * as sinon from 'sinon';

describe('ExceptionlessClient', () => {
  let xhr: any;

  beforeEach(() => {
    xhr = sinon.useFakeXMLHttpRequest();
  });

  afterEach(() => {
    xhr.restore();
  });

  it('should use event reference ids', (done) => {
    let error = new Error('From Unit Test');

    let client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    expect(client.config.lastReferenceIdManager.getLast()).to.be.null;
    client.submitException(error, (context: EventPluginContext) => {
      expect(client.config.lastReferenceIdManager.getLast()).to.be.null;
    });

    let numberOfPlugins = client.config.plugins.length;
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
    let client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    let builder = client.createLog(null, 'Unit Test message', 'Trace');

    expect(builder.target.source).to.be.undefined;
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data['@level']).to.equal('Trace');
  });

  it('should accept source and message', () => {
    let client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    let builder = client.createLog('ExceptionlessClient', 'Unit Test message');

    expect(builder.target.source).to.equal('ExceptionlessClient');
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data).to.be.undefined;
  });

  it('should accept source and message', () => {
    let client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    let builder = client.createLog('Unit Test message');

    expect(builder.target.source).to.be.undefined;
    expect(builder.target.message).to.equal('Unit Test message');
    expect(builder.target.data).to.be.undefined;
  });

  it('should allow construction via apiKey and serverUrl parameters', () => {
    let client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');

    expect(client.config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(client.config.serverUrl).to.equal('http://localhost:50000');
  });

  it('should allow construction via a configuration object', () => {
    let client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:50000'
    });

    expect(client.config.apiKey).to.equal('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    expect(client.config.serverUrl).to.equal('http://localhost:50000');
  });
});
