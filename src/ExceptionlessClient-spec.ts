import { ExceptionlessClient } from 'ExceptionlessClient';
import { EventPluginContext } from './plugins/EventPluginContext';

describe('ExceptionlessClient', () => {
  it('should use event reference ids', (done) => {
    var error = new Error('From Unit Test');

    var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    expect(client.config.lastReferenceIdManager.getLast()).toBe(null);
    client.submitException(error, (context:EventPluginContext) => {
      expect(client.config.lastReferenceIdManager.getLast()).toBe(null);
    });

    var numberOfPlugins = client.config.plugins.length;
    client.config.useReferenceIds();
    expect(client.config.plugins.length).toBe(numberOfPlugins + 1);

    client.submitException(error, (context:EventPluginContext) => {
      if (!context.cancelled) {
        expect(client.config.lastReferenceIdManager.getLast()).not.toBe(null);
      } else {
        expect(client.config.lastReferenceIdManager.getLast()).toBe(null);
      }

      done();
    });
  }, 5000);

  it('should accept null source', () => {
    var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    var builder = client.createLog(null, 'Unit Test message', 'Trace');

    expect(builder.target.source).toBeUndefined();
    expect(builder.target.message).toBe('Unit Test message');
    expect(builder.target.data['@level']).toBe('Trace');
  });

  it('should accept source and message', () => {
    var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    var builder = client.createLog('ExceptionlessClient', 'Unit Test message');

    expect(builder.target.source).toBe('ExceptionlessClient');
    expect(builder.target.message).toBe('Unit Test message');
    expect(builder.target.data).toBeUndefined();
  });

  it('should accept source and message', () => {
    var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    var builder = client.createLog('Unit Test message');

    expect(builder.target.source).toBeUndefined();
    expect(builder.target.message).toBe('Unit Test message');
    expect(builder.target.data).toBeUndefined();
  });
});
