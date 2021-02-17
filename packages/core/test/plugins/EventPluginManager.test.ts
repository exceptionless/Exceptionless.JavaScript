import { Configuration } from "../../src/configuration/Configuration";
import { ContextData } from "../../src/plugins/ContextData";
import { ExceptionlessClient } from "../../src/ExceptionlessClient";
import { EventPluginContext } from "../../src/plugins/EventPluginContext";
import { EventPluginManager } from "../../src/plugins/EventPluginManager";

beforeEach(() => {
  Configuration.defaults.updateSettingsWhenIdleInterval = -1;
});

describe('EventPluginManager', () => {
  test('should add items to the event.', done => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const context = new EventPluginContext(client, {}, new ContextData());
    expect(context.event.source).toBeUndefined();
    expect(context.event.geo).toBeUndefined();

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx: EventPluginContext, next?: () => void) => {
      setTimeout(() => {
        ctx.event.source = 'plugin 1';

        if (next) {
          next();
        }
      }, 25);
    });

    client.config.addPlugin('2', 2, (ctx: EventPluginContext, next?: () => void) => {
      ctx.event.geo = '43.5775,88.4472';

      if (next) {
        next();
      }
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).toBe(false);
      expect(ctx.event.source).toBe('plugin 1');
      expect(ctx.event.geo).toBe('43.5775,88.4472');

      done();
    });
  });

  test('setting cancel should stop plugin execution.', done => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const context = new EventPluginContext(client, {}, new ContextData());
    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx: EventPluginContext, next?: () => void) => {
      ctx.cancelled = true;

      if (next) {
        next();
      }
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  });

  test('throwing error should stop plugin execution.', done => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBeNull();
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

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  });

  test('throwing async error should stop plugin execution.', done => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx: EventPluginContext, next?: () => void) => {
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
      }, 25);
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).toBe(true);
      done();
    });
  });

  test('should cancel via timeout.', done => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, () => {
      setTimeout(done, 25);
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).toBe(true);
    });

    EventPluginManager.run(context, () => {
      // Fail this test as this callback should not be called.
      expect(false).toBe(true);
    });
  });

  test('should ensure config plugins are not wrapped.', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.toBeNull();
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx: EventPluginContext, next?: () => void) => {
      if (next) {
        next();
      }
    });

    expect(client.config.plugins[0].name).toBe('1');
    expect(client.config.plugins.length).toBe(1);
    EventPluginManager.run(context, () => {
      expect(client.config.plugins[0].name).toBe('1');
    });
    expect(client.config.plugins.length).toBe(1);

    EventPluginManager.run(context, () => {
      expect(client.config.plugins[0].name).toBe('1');
    });
    expect(client.config.plugins.length).toBe(1);
  });
});
