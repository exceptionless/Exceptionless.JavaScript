import { expect } from 'chai';
import { ExceptionlessClient } from '../../ExceptionlessClient';
import { IEvent } from '../../models/IEvent';
import { DefaultErrorParser } from '../../services/DefaultErrorParser';
import { EventPluginContext } from '../EventPluginContext';
import { EventExclusionPlugin } from './EventExclusionPlugin';

describe('EventExclusionPlugin', () => {
  describe('should exclude log levels', () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
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

      return !!context.cancelled;
    }

    it('<null>', () => expect(run(null, null, null, null)).to.be.false);
    it('Test', () => expect(run('Test', null, null, null)).to.be.false);
    it('[Trace] Test', () => expect(run('Test', 'Trace', null, null)).to.be.false);
    it('[Off] Test', () => expect(run('Test', 'Off', null, null)).to.be.true);
    it('[Abc] Test', () => expect(run('Test', 'Abc', null, null)).to.be.false);
    it('[Off] Test', () => expect(run('Test', 'Off', null, null)).to.be.true);
    it('[Trace] Test (source min level: false)', () => expect(run('Test', 'Trace', '@@log:Test', 'false')).to.be.true);
    it('[Trace] Test (source min level: no)', () => expect(run('Test', 'Trace', '@@log:Test', 'no')).to.be.true);
    it('[Trace] Test (source min level: 0)', () => expect(run('Test', 'Trace', '@@log:Test', '0')).to.be.true);
    it('[Trace] Test (source min level: true)', () => expect(run('Test', 'Trace', '@@log:Test', 'true')).to.be.false);
    it('[Trace] Test (source min level: yes)', () => expect(run('Test', 'Trace', '@@log:Test', 'yes')).to.be.false);
    it('[Trace] Test (source min level: 1)', () => expect(run('Test', 'Trace', '@@log:Test', '1')).to.be.false);
    it('[Trace] Test (source min level: Debug)', () => expect(run('Test', 'Trace', '@@log:Test', 'Debug')).to.be.true);
    it('[Info] Test (source min level: Debug)', () => expect(run('Test', 'Info', '@@log:Test', 'Debug')).to.be.false);
    it('[Trace] Test (global min level: Debug)', () => expect(run('Test', 'Trace', '@@log:*', 'Debug')).to.be.true);
    it('[Warn] Test (global min level: Debug)', () => expect(run('Test', 'Warn', '@@log:*', 'Debug')).to.be.false);
  });

  describe('should exclude log levels with info default:', () => {
    function run(source: string, level: string, settingKey: string, settingValue: string): boolean {
      const client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
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

      return !!context.cancelled;
    }

    it('<null>', () => expect(run(null, null, null, null)).to.be.false);
    it('Test', () => expect(run('Test', null, null, null)).to.be.false);
    it('[Trace] Test', () => expect(run('Test', 'Trace', null, null)).to.be.true);
    it('[Warn] Test', () => expect(run('Test', 'Warn', null, null)).to.be.false);
    it('[Error] Test (source min level: Debug)', () => expect(run('Test', 'Error', '@@log:Test', 'Debug')).to.be.false);
    it('[Debug] Test (source min level: Debug)', () => expect(run('Test', 'Debug', '@@log:Test', 'Debug')).to.be.false);
  });

  describe('should exclude source type', () => {
    function run(type: string, source: string, settingKey: string, settingValue: string|boolean): boolean {
      const client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      if (settingKey) {
        client.config.settings[settingKey] = settingValue;
      }

      const context = new EventPluginContext(client, { type, source, data: {} });
      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return !!context.cancelled;
    }

    it('<null>', () => expect(run(null, null, null, null)).to.be.false);
    it('<null>', () => expect(run('usage', null, null, null)).to.be.false);
    it('<null>', () => expect(run('usage', 'test', null, null)).to.be.false);
    it('<null>', () => expect(run('usage', 'test', '@@usage:Test', true)).to.be.false);
    it('<null>', () => expect(run('usage', 'test', '@@usage:Test', false)).to.be.true);
    it('<null>', () => expect(run('usage', 'test', '@@usage:*', false)).to.be.true);
    it('<null>', () => expect(run('404', '/unknown', '@@404:*', false)).to.be.true);
    it('<null>', () => expect(run('404', '/unknown', '@@404:/unknown', false)).to.be.true);
    it('<null>', () => expect(run('404', '/unknown', '@@404:/unknown', true)).to.be.false);
  });

  describe('should exclude exception type:', () => {
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
      const client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      if (settingKey) {
        client.config.settings[settingKey] = false;
      }

      const errorParser = new DefaultErrorParser();
      const context = new EventPluginContext(client, { type: 'error', data: { } });
      context.event.data['@error'] = errorParser.parse(context, createException());

      const plugin = new EventExclusionPlugin();
      plugin.run(context);

      return !!context.cancelled;
    }

    it('<null>', () => expect(run(null)).to.be.false);
    it('@@error:Error', () => expect(run('@@error:Error')).to.be.false);
    it('@@error:ReferenceError', () => expect(run('@@error:ReferenceError')).to.be.true);
    it('@@error:*Error', () => expect(run('@@error:*Error')).to.be.true);
    it('@@error:*', () => expect(run('@@error:*')).to.be.true);
  });
});
