/// <reference path="typings/tsd.d.ts" />
/// <reference path="exceptionless.ts" />

//import { Configuration, ExceptionlessClient } from 'Exceptionless';
module Exceptionless {
  describe('ExceptionlessClient', () => {
    it('disable the client with null api key', () => {
      var client = new ExceptionlessClient(null);
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe(null);
      expect(client.config.enabled).toBe(false);
    });

    it('should set the api key and enabled to true', () => {
      var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.enabled).toBe(true);
    });

    it('apply client configuration', () => {
      var client = new ExceptionlessClient(null);
      expect(client.config).not.toBe(null);
      expect(client.config.apiKey).toBe(null);
      expect(client.config.enabled).toBe(false);

      client.config.setApiKey('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(client.config.enabled).toBe(true);
    });
  });

  describe('EventQueue', () => {
    it('should enqueue event', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.storage.count()).toBe(0);
      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(1);
    });

    it('should process queue', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.storage.count()).toBe(0);
      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(1);
      config.queue.process();
      expect(config.storage.count()).toBe(0);
    });

    it('should discard event submission', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.storage.count()).toBe(0);
      config.queue.suspendProcessing(1, true);

      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(0);
    });

    it('should suspend processing', (done) => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.storage.count()).toBe(0);
      config.queue.suspendProcessing(.0001);

      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(1);

      setTimeout(() => {
        expect(config.storage.count()).toBe(0);
        done();
      }, 10000);
    }, 21000);
  });

  describe('SubmissionClient', () => {
    it('should submit events', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should submit user description', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should get project settings', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });
  });

  describe('Storage', () => {
    it('should save events', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should get saved events', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });

    it('should clear all events', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
    });
  });
}
