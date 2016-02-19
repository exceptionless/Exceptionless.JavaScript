import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { expect } from 'chai';

describe('DefaultEventQueue', () => {

  let config: Configuration;

  beforeEach(() => {
    config = getConfiguration();
  });

  afterEach(() => {
    let queue = <any>config.queue;
    clearInterval(queue._queueTimer);
    config = null;
  });

  function getConfiguration(): Configuration {
    let result: Configuration = new Configuration({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:50000'
    });

    expect(result.storage.queue.get().length).to.equal(0);
    return result;
  }

  it('should enqueue event', () => {
    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);
  });

  it('should process queue', () => {
    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);
    config.queue.process();

    if (!(<any>config.queue)._suspendProcessingUntil) {
      expect(config.storage.queue.get().length).to.equal(0);
    } else {
      expect(config.storage.queue.get().length).to.equal(1);
    }
  });

  it('should discard event submission', () => {
    config.queue.suspendProcessing(1, true);

    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(0);
  });

  it('should suspend processing', (done) => {
    config.queue.suspendProcessing(.0001);

    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);

    setTimeout(() => {
      if (!(<any>config.queue)._suspendProcessingUntil) {
        expect(config.storage.queue.get().length).to.equal(0);
      } else {
        expect(config.storage.queue.get().length).to.equal(1);
      }

      done();
    });
  });
});
