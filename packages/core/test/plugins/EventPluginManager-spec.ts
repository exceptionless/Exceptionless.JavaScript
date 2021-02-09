import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { Configuration } from "@exceptionless/core/configuration/Configuration";
import { ExceptionlessClient } from '@exceptionless/core/ExceptionlessClient';
import { ContextData } from '@exceptionless/core/plugins/ContextData';
import { EventPluginContext } from '@exceptionless/core/plugins/EventPluginContext';
import { EventPluginManager } from '@exceptionless/core/plugins/EventPluginManager';

beforeEach(() => {
  Configuration.defaults.updateSettingsWhenIdleInterval = -1;
});

describe('EventPluginManager', () => {
  it('should add items to the event.', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const context = new EventPluginContext(client, {}, new ContextData());
    expect(context.event.source).to.be.undefined;
    expect(context.event.geo).to.be.undefined;

    expect(client.config.plugins).not.to.be.null;
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
      expect(ctx.cancelled).to.be.false;
      expect(ctx.event.source).to.equal('plugin 1');
      expect(ctx.event.geo).to.equal('43.5775,88.4472');

      done();
    });
  });

  it('setting cancel should stop plugin execution.', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    const context = new EventPluginContext(client, {}, new ContextData());
    expect(client.config.plugins).not.to.be.null;
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
      expect(false).to.be.true;
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).to.be.true;
      done();
      done = () => { };
    });
  });

  it('throwing error should stop plugin execution.', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.to.be.null;
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, () => {
      throw new Error('Random Error');
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).to.be.true;
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).to.be.true;
      done();
    });
  });

  it('throwing async error should stop plugin execution.', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.to.be.null;
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
      expect(false).to.be.true;
    });

    EventPluginManager.run(context, (ctx?: EventPluginContext) => {
      expect(ctx.cancelled).to.be.true;
      done();
    });
  });

  it('should cancel via timeout.', (done) => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.to.be.null;
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, () => {
      setTimeout(done, 25);
    });

    client.config.addPlugin('2', 2, () => {
      // Fail this test as this plugin should not be called.
      expect(false).to.be.true;
    });

    EventPluginManager.run(context, () => {
      // Fail this test as this callback should not be called.
      expect(false).to.be.true;
    });
  });

  it('should ensure config plugins are not wrapped.', () => {
    const client = new ExceptionlessClient({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });
    const context = new EventPluginContext(client, {}, new ContextData());

    expect(client.config.plugins).not.to.be.null;
    while (client.config.plugins.length > 0) {
      client.config.removePlugin(client.config.plugins[0]);
    }

    client.config.addPlugin('1', 1, (ctx: EventPluginContext, next?: () => void) => {
      if (next) {
        next();
      }
    });

    expect(client.config.plugins[0].name).to.equal('1');
    expect(client.config.plugins.length).to.equal(1);
    EventPluginManager.run(context, () => {
      expect(client.config.plugins[0].name).to.equal('1');
    });
    expect(client.config.plugins.length).to.equal(1);

    EventPluginManager.run(context, () => {
      expect(client.config.plugins[0].name).to.equal('1');
    });
    expect(client.config.plugins.length).to.equal(1);
  });
});
