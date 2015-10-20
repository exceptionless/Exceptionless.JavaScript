import { ContextData } from './ContextData';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { EventPluginManager } from './EventPluginManager';
import { EventPluginContext } from './EventPluginContext';

describe('EventPluginManager', () => {
  it('should add items to the event.', (done) => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());
    expect(context.event.source).toBeUndefined();
    expect(context.event.geo).toBeUndefined();

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx:EventPluginContext, next?:() => void) => {
      setTimeout(() => {
        ctx.event.source = 'plugin 1';

        if (next) {
          next();
        }
      }, 100);
    });

    client.config.addPlugin('2', 2, (ctx:EventPluginContext, next?:() => void) => {
      ctx.event.geo = '43.5775,88.4472';

      if (next) {
        next();
      }
    });

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(ctx.cancelled).toBeUndefined();
      expect(ctx.event.source).toBe('plugin 1');
      expect(ctx.event.geo).toBe('43.5775,88.4472');

      done();
    });
  }, 5000);

  it('setting cancel should stop plugin execution.', (done) => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx:EventPluginContext, next?:() => void) => {
      ctx.cancelled = true;

      if (next) {
        next();
      }
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  }, 5000);

  it('throwing error should stop plugin execution.', (done) => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, () => {
      throw new Error('Random Error');
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  }, 5000);

  it('throwing async error should stop plugin execution.', (done) => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx:EventPluginContext, next?:() => void) => {
      // NOTE: Currently you have to catch it and set cancelled.
      setTimeout(() => {
        try {
          throw new Error('Random Error');
        } catch (e) {
          ctx.cancelled = true;
        }

        if (next) {
          next();
        }
      }, 500);
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  }, 5000);

  it('should cancel via timeout.', (done) => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx:EventPluginContext, next?:() => void) => {
      setTimeout(done, 100);
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      // Fail this test as this callback should not be called.
      expect(false).toBe(true);
    });
  }, 500);

  it('should ensure config plugins are not wrapped.', () => {
    let client = new ExceptionlessClient({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    let context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBe(null);
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx:EventPluginContext, next?:() => void) => {
      if (next) {
        next();
      }
    });

    expect(client.config.plugins[0].name).toBe('1');
    expect(client.config.plugins.length).toBe(1);
    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(client.config.plugins[0].name).toBe('1');
    });
    expect(client.config.plugins.length).toBe(1);

    EventPluginManager.run(context, (ctx?:EventPluginContext) => {
      expect(client.config.plugins[0].name).toBe('1');
    });
    expect(client.config.plugins.length).toBe(1);
  });
});
