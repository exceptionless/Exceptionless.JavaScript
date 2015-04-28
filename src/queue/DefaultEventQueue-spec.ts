import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';

describe('DefaultEventQueue', () => {
  it('should enqueue event', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.count()).toBe(0);
    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.count()).toBe(1);
  });

  it('should process queue', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.count()).toBe(0);
    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.count()).toBe(1);
    config.queue.process();
    expect(config.storage.count()).toBe(0);
  });

  it('should discard event submission', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.count()).toBe(0);
    config.queue.suspendProcessing(1, true);

    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.count()).toBe(0);
  });

  it('should suspend processing', (done) => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
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
