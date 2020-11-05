import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { Configuration } from "../../configuration/Configuration";
import { ExceptionlessClient } from '../../ExceptionlessClient';
import { IEvent } from '../../models/IEvent';
import { DefaultErrorParser } from '../../services/DefaultErrorParser';
import { EventPluginContext } from '../EventPluginContext';
import { EventExclusionPlugin } from './EventExclusionPlugin';

beforeEach(() => {
  Configuration.defaults.updateSettingsWhenIdleInterval = -1;
});

describe('EventExclusionPlugin', () => {
  describe('should exclude log levels', () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: IEvent = { type: 'log', source, data: {} };
      if (level) {
        ev.data['@level'] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    it('<null>', () => { expect(run(null, null, null, null)).to.be.false; });
    it('Test', () => { expect(run('Test', null, null, null)).to.be.false; });
    it('[Trace] Test', () => { expect(run('Test', 'Trace', null, null)).to.be.false; });
    it('[Off] Test', () => { expect(run('Test', 'Off', null, null)).to.be.true; });
    it('[Abc] Test', () => { expect(run('Test', 'Abc', null, null)).to.be.false; });
    it('[Off] Test', () => { expect(run('Test', 'Off', null, null)).to.be.true; });
    it('[Trace] <null> (source min level: Off', () => { expect(run(null, 'Trace', '@@log:', 'Off')).to.be.false; });
    it('[Trace] <null> (global min level: Off', () => { expect(run(null, 'Trace', '@@log:*', 'Off')).to.be.true; });
    it('[Trace] <empty> (source min level: Off', () => { expect(run('', 'Trace', '@@log:', 'Off')).to.be.true; }); // Becomes Global Log Level
    it('[Trace] <empty> (global min level: Off', () => { expect(run('', 'Trace', '@@log:*', 'Off')).to.be.true; });
    it('[Trace] Test (source min level: false)', () => { expect(run('Test', 'Trace', '@@log:Test', 'false')).to.be.true; });
    it('[Trace] Test (source min level: no)', () => { expect(run('Test', 'Trace', '@@log:Test', 'no')).to.be.true; });
    it('[Trace] Test (source min level: 0)', () => { expect(run('Test', 'Trace', '@@log:Test', '0')).to.be.true; });
    it('[Trace] Test (source min level: true)', () => { expect(run('Test', 'Trace', '@@log:Test', 'true')).to.be.false; });
    it('[Trace] Test (source min level: yes)', () => { expect(run('Test', 'Trace', '@@log:Test', 'yes')).to.be.false; });
    it('[Trace] Test (source min level: 1)', () => { expect(run('Test', 'Trace', '@@log:Test', '1')).to.be.false; });
    it('[Trace] Test (source min level: Debug)', () => { expect(run('Test', 'Trace', '@@log:Test', 'Debug')).to.be.true; });
    it('[Info] Test (source min level: Debug)', () => { expect(run('Test', 'Info', '@@log:Test', 'Debug')).to.be.false; });
    it('[Trace] Test (global min level: Debug)', () => { expect(run('Test', 'Trace', '@@log:*', 'Debug')).to.be.true; });
    it('[Warn] Test (global min level: Debug)', () => { expect(run('Test', 'Warn', '@@log:*', 'Debug')).to.be.false; });
  });

  describe('should exclude log levels with info default', () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();
      client.config.settings['@@log:*'] = 'Info';
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const ev: IEvent = { type: 'log', source, data: {} };
      if (level) {
        ev.data['@level'] = level;
      }

      const context = new EventPluginContext(client, ev);
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    it('<null>', () => { expect(run(null, null, null, null)).to.be.false; });
    it('Test', () => { expect(run('Test', null, null, null)).to.be.false; });
    it('[Trace] Test', () => { expect(run('Test', 'Trace', null, null)).to.be.true; });
    it('[Warn] Test', () => { expect(run('Test', 'Warn', null, null)).to.be.false; });
    it('[Error] Test (source min level: Debug)', () => { expect(run('Test', 'Error', '@@log:Test', 'Debug')).to.be.false; });
    it('[Debug] Test (source min level: Debug)', () => { expect(run('Test', 'Debug', '@@log:Test', 'Debug')).to.be.false; });
  });

  describe('should respect min log levels settings order', () => {
    const plugin = new EventExclusionPlugin();
    let settings: Record<string, string> = { "@@log:": "Info", "@@log:*": "Debug" };

    it('<null> (global min level: debug)', () => { expect(plugin.getMinLogLevel(settings, null)).to.be.equal(1); });
    it('<empty> (source min level: info)', () => { expect(plugin.getMinLogLevel(settings, '')).to.be.equal(2); });
    it('* (global min level: debug)', () => { expect(plugin.getMinLogLevel(settings, '*')).to.be.equal(1); });

    settings = { "@@log:*": "Debug", "@@log:": "Info" };
    it('<empty> (source min level: info)', () => { expect(plugin.getMinLogLevel(settings, '')).to.be.equal(2); });
    it('* (global min level: debug)', () => { expect(plugin.getMinLogLevel(settings, '*')).to.be.equal(1); });

    settings = {
      "@@log:*": "Fatal",
      "@@log:": "Debug",
      "@@log:abc*": "Off",
      "@@log:abc.de*": "Debug",
      "@@log:abc.def*": "Info",
      "@@log:abc.def.ghi": "Trace"
    };

    it('<null> (global min level: fatal)', () => { expect(plugin.getMinLogLevel(settings, null)).to.be.equal(5); });
    it('<empty> (source min level: debug)', () => { expect(plugin.getMinLogLevel(settings, '')).to.be.equal(1); });
    it('abc (source min level: off)', () => { expect(plugin.getMinLogLevel(settings, 'abc')).to.be.equal(6); });
    it('abc.def (source min level: info)', () => { expect(plugin.getMinLogLevel(settings, 'abc.def')).to.be.equal(2); });
    it('abc.def.ghi (source min level: trace)', () => { expect(plugin.getMinLogLevel(settings, 'abc.def.ghi')).to.be.equal(0); });

    settings = {
      "@@log:abc.def.ghi": "Trace",
      "@@log:abc.def*": "Info",
      "@@log:abc*": "Off"
    };

    it('abc (source min level: off)', () => { expect(plugin.getMinLogLevel(settings, 'abc')).to.be.equal(6); });
    it('abc.def (source min level: info)', () => { expect(plugin.getMinLogLevel(settings, 'abc.def')).to.be.equal(2); });
    it('abc.def.ghi (source min level: trace)', () => { expect(plugin.getMinLogLevel(settings, 'abc.def.ghi')).to.be.equal(0); });
  });

  describe('should exclude source type', () => {
    function run(type: string, source: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const context = new EventPluginContext(client, { type, source, data: {} });
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return context.cancelled;
    }

    it('<null>', () => { expect(run(null, null, null, null)).to.be.false; });
    it('usage=<null>', () => { expect(run('usage', null, null, null)).to.be.false; });
    it('usage=test', () => { expect(run('usage', 'test', null, null)).to.be.false; });
    it('usage=test on', () => { expect(run('usage', 'test', '@@usage:Test', 'true')).to.be.false; });
    it('usage=test off', () => { expect(run('usage', 'test', '@@usage:Test', 'false')).to.be.true; });
    it('usage=test (global off)', () => { expect(run('usage', 'test', '@@usage:*', 'false')).to.be.true; });
    it('404=/unknown (global off)', () => { expect(run('404', '/unknown', '@@404:*', 'false')).to.be.true; });
    it('404=/unknown on', () => { expect(run('404', '/unknown', '@@404:/unknown', 'true')).to.be.false; });
    it('404=/unknown off', () => { expect(run('404', '/unknown', '@@404:/unknown', 'false')).to.be.true; });
    it('404=<null> off', () => { expect(run('404', null, '@@404:*', 'false')).to.be.true; });
    it('404=<null> empty off', () => { expect(run('404', null, '@@404:', 'false')).to.be.true; });
    it('404=<empty> off', () => { expect(run('404', '', '@@404:', 'false')).to.be.true; });
  });

  describe('should exclude exception type', () => {
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

    function run(settingKey: string): boolean {
      const client = new ExceptionlessClient();

      if (settingKey) {
        client.config.settings[settingKey] = 'false';
      }

      const errorParser = new DefaultErrorParser();
      const context = new EventPluginContext(client, { type: 'error', data: {} });
      context.event.data['@error'] = errorParser.parse(context, createException());

      const plugin = new EventExclusionPlugin();
      plugin.run(context);
      return context.cancelled;
    }

    it('<null>', () => { expect(run(null)).to.be.false; });
    it('@@error:Error', () => { expect(run('@@error:Error')).to.be.false; });
    it('@@error:ReferenceError', () => { expect(run('@@error:ReferenceError')).to.be.true; });
    it('@@error:*Error', () => { expect(run('@@error:*Error')).to.be.true; });
    it('@@error:*', () => { expect(run('@@error:*')).to.be.true; });
  });
});
