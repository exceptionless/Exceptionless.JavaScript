/// <reference path="typings/tsd.d.ts" />
/// <reference path="exceptionless.ts" />

//import { Configuration, ExceptionlessClient } from 'Exceptionless';
module Exceptionless {
  describe('ExceptionlessClient', () => {
    it('should use event reference ids', (done) => {
      var error = new Error('From Unit Test');

      var client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      expect(client.config.lastReferenceIdManager.getLast()).toBe(null);
      client.submitException(error).then(
        () => expect(client.config.lastReferenceIdManager.getLast()).toBe(null),
        () => expect(client.config.lastReferenceIdManager.getLast()).toBe(null)
      );

      var numberOfPlugins = client.config.plugins.length;
      client.config.useReferenceIds();
      expect(client.config.plugins.length).toBe(numberOfPlugins + 1);

      client.submitException(error)
        .then(
          () => expect(client.config.lastReferenceIdManager.getLast()).not.toBe(null),
          () => expect(client.config.lastReferenceIdManager.getLast()).toBe(null))
        .then(done);
    }, 5000);
  });

  describe('Configuration', () => {
    it('should set the api key to null and enabled to false', () => {
      var config = new Configuration(null);
      expect(config.apiKey).toBe(null);
      expect(config.enabled).toBe(false);
    });

    it('should set the api key and enabled to true', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      expect(config).not.toBe(null);
      expect(config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.enabled).toBe(true);
    });

    it('apply client configuration', () => {
      var config = new Configuration(null);
      expect(config.apiKey).toBe(null);
      expect(config.enabled).toBe(false);

      config.apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
      expect(config.apiKey).toBe('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.enabled).toBe(true);
    });

    it('should not add duplicate plugin', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.plugins).not.toBe(null);
      while(config.plugins.length > 0) {
        config.removePlugin(config.plugins[0]);
      }

      config.addPlugin('test', 20, (context:EventPluginContext) => {});
      config.addPlugin('test', 20, (context:EventPluginContext) => {});
      expect(config.plugins.length).toBe(1);
    });

    it('should generate plugin name and priority', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.plugins).not.toBe(null);
      while(config.plugins.length > 0) {
        config.removePlugin(config.plugins[0]);
      }

      config.addPlugin(null, null, (context:EventPluginContext) => {});
      expect(config.plugins.length).toBe(1);
      expect(config.plugins[0].name).not.toBe(null);
      expect(config.plugins[0].priority).toBe(0);
    });

    it('should sort plugins by priority', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw');
      expect(config.plugins).not.toBe(null);
      while(config.plugins.length > 0) {
        config.removePlugin(config.plugins[0]);
      }

      config.addPlugin('3', 3, (context:EventPluginContext) => {});
      config.addPlugin('1', 1, (context:EventPluginContext) => {});
      config.addPlugin('2', 2, (context:EventPluginContext) => {});
      expect(config.plugins.length).toBe(3);
      expect(config.plugins[0].priority).toBe(1);
      expect(config.plugins[1].priority).toBe(2);
      expect(config.plugins[2].priority).toBe(3);
    });
  });

  describe('EventQueue', () => {
    it('should enqueue event', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      expect(config.storage.count()).toBe(0);
      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(1);
    });

    it('should process queue', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      expect(config.storage.count()).toBe(0);
      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(1);
      config.queue.process();
      expect(config.storage.count()).toBe(0);
    });

    it('should discard event submission', () => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      expect(config.storage.count()).toBe(0);
      config.queue.suspendProcessing(1, true);

      var event:IEvent = { type: 'log', reference_id: '123454321' };
      config.queue.enqueue(event);
      expect(config.storage.count()).toBe(0);
    });

    it('should suspend processing', (done) => {
      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
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
    it('should submit events', (done) => {
      function processResponse(response:SubmissionResponse) {
        if (response.success) {
          expect(response.message).toBe(null);
        } else {
          expect(response.message).toBe('Unable to connect to server.');
        }
      }

      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      var submissionClient = new SubmissionClient();
      submissionClient.submit([{ type: 'log', message: 'From js client', reference_id: '123454321' }], config)
        .then(processResponse, processResponse)
        .then(done);
    }, 5000);


    it('should submit invalid object data', (done) => {
      function processResponse(response:SubmissionResponse) {
        if (response.success) {
          expect(response.message).toBe(null);
        } else {
          expect(response.message).toBe('Unable to connect to server.');
        }
      }

      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      var event:IEvent = { type: 'log', message: 'From js client', reference_id: '123454321', data: {
        name: 'blake',
        age: function() { throw new Error('Test'); }
      }};

      var submissionClient = new SubmissionClient();
      submissionClient.submit([event], config)
        .then(processResponse, processResponse)
        .then(done);
    }, 5000);

    it('should submit user description', (done) => {
      function processResponse(response:SubmissionResponse) {
        if (response.success) {
          expect(response.message).toBe(null);
        } else {
          expect(response.message).toBe('Unable to connect to server.');
        }
      }

      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      var submissionClient = new SubmissionClient();
      submissionClient.submitDescription('123454321', { email_address: 'norply@exceptionless.io', description: 'unit test' } , config)
        .then(processResponse, processResponse)
        .then(done);
    }, 5000);

    it('should get project settings', (done) => {
      function processResponse(response:SettingsResponse) {
        if (response.success) {
          expect(response.message).toBe(null);
          expect(response.settings).not.toBe(null);
          expect(response.settingsVersion).toBeGreaterThan(-1);
        } else {
          expect(response.message).toBe('Unable to connect to server.');
        }
      }

      var config = new Configuration('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
      var submissionClient = new SubmissionClient();
      submissionClient.getSettings(config)
        .then(processResponse, processResponse)
        .then(done);
    }, 5000);
  });

  describe('Storage', () => {
    it('should save events', () => {
      var storage = new InMemoryStorage<IEvent>();
      var key = 'ex-LhhP1C9gi-q-';
      var event1:IEvent = { type: 'log', reference_id: key + '123454321' };
      var event2:IEvent = { type: 'log', reference_id: key + '098765432' };
      expect(storage.count()).toBe(0);
      storage.save(event1.reference_id, event);
      expect(storage.count()).toBe(1);
      expect(storage.count(key)).toBe(1);
      storage.save(event2.reference_id, event);
      expect(storage.count()).toBe(2);
      expect(storage.count(key)).toBe(2);
      expect(storage.count(key + '1')).toBe(1);
    });

    it('should get saved events', () => {
      var storage = new InMemoryStorage<IEvent>();
      var key = 'ex-LhhP1C9gi-q-';
      var event1:IEvent = { type: 'log', reference_id: key + '11' };
      var event2:IEvent = { type: 'log', reference_id: key + '12' };
      var event3:IEvent = { type: 'log', reference_id: key + '13' };
      var event4:IEvent = { type: 'log', reference_id: key + '14' };
      var event5:IEvent = { type: 'log', reference_id: key + '15' };
      var event6:IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.count()).toBe(0);

      storage.save(event1.reference_id, event1);
      storage.save(event2.reference_id, event2);
      storage.save(event3.reference_id, event3);
      storage.save(event4.reference_id, event4);
      storage.save(event5.reference_id, event5);
      storage.save(event6.reference_id, event6);
      expect(storage.count()).toBe(6);

      var ev = storage.get(event1.reference_id, 1)[0];
      expect(ev).toBe(event1);
      expect(storage.count()).toBe(5);

      var events = storage.get(key, 2);
      expect(events.length).toBe(2);
      expect(storage.count()).toBe(3);

      events = storage.get(key);
      expect(events.length).toBe(3);
      expect(storage.count()).toBe(0);
    });

    it('should clear all events', () => {
      var storage = new InMemoryStorage<IEvent>();
      var key = 'ex-LhhP1C9gi-q-';
      var event1:IEvent = { type: 'log', reference_id: key + '11' };
      var event2:IEvent = { type: 'log', reference_id: key + '12' };
      var event3:IEvent = { type: 'log', reference_id: key + '13' };
      var event4:IEvent = { type: 'log', reference_id: key + '14' };
      var event5:IEvent = { type: 'log', reference_id: key + '15' };
      var event6:IEvent = { type: 'log', reference_id: key + '16' };
      expect(storage.count()).toBe(0);

      storage.save(event1.reference_id, event1);
      storage.save(event2.reference_id, event2);
      storage.save(event3.reference_id, event3);
      storage.save(event4.reference_id, event4);
      storage.save(event5.reference_id, event5);
      storage.save(event6.reference_id, event6);
      expect(storage.count()).toBe(6);

      storage.clear(event1.reference_id);
      expect(storage.count()).toBe(5);

      storage.clear();
      expect(storage.count()).toBe(0);
    });
  });

  describe('ModuleInfoPlugin', () => {
      it('should parse version from script source', () => {
        var mi = new Exceptionless.ModuleInfoPlugin();
        expect(mi.getVersion('https://code.jquery.com/jquery-2.1.3.js')).toBe('2.1.3');
        expect(mi.getVersion('//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css')).toBe('3.3.4');
        expect(mi.getVersion('https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.css')).toBe('2.0');
        expect(mi.getVersion('https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js')).toBe('0.3.0');
        expect(mi.getVersion('https://cdnjs.cloudflare.com/ajax/libs/angular-google-maps/2.1.0-X.10/angular-google-maps.min.js')).toBe('2.1.0-X.10');
        expect(mi.getVersion('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/2.1.8-M1/swagger-ui.min.js')).toBe('2.1.8-M1');
        expect(mi.getVersion('https://cdnjs.cloudflare.com/BLAH/BLAH.min.js')).toBe(null);
      });
  });
}
