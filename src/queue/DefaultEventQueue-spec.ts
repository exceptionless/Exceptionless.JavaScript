import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';

describe('DefaultEventQueue', () => {
  it('should enqueue event', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.getList().length).toBe(0);
    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(1);
  });

  it('should process queue', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.getList().length).toBe(0);
    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(1);
    config.queue.process();

    if (!(<any>config.queue)._suspendProcessingUntil) {
      expect(config.storage.getList().length).toBe(0);
    } else {
      expect(config.storage.getList().length).toBe(1);
    }
  });

  it('should discard event submission', () => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.getList().length).toBe(0);
    config.queue.suspendProcessing(1, true);

    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(0);
  });

  it('should suspend processing', (done) => {
    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    expect(config.storage.getList().length).toBe(0);
    config.queue.suspendProcessing(.0001);

    var event:IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(1);

    setTimeout(() => {
      if (!(<any>config.queue)._suspendProcessingUntil) {
        expect(config.storage.getList().length).toBe(0);
      } else {
        expect(config.storage.getList().length).toBe(1);
      }

      done();
    }, 10000);
  }, 21000);
});
