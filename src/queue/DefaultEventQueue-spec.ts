import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';

describe('DefaultEventQueue', () => {
  function getConfiguration(): Configuration {
    let config: Configuration = new Configuration({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:50000'
    });

    expect(config.storage.getList().length).toBe(0);
    return config;
  }

  it('should enqueue event', () => {
    let config: Configuration = getConfiguration();
    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(1);
  });

  it('should process queue', () => {
    let config: Configuration = getConfiguration();
    let event: IEvent = { type: 'log', reference_id: '123454321' };
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
    let config: Configuration = getConfiguration();
    config.queue.suspendProcessing(1, true);

    let event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.getList().length).toBe(0);
  });

  it('should suspend processing', (done) => {
    let config: Configuration = getConfiguration();
    config.queue.suspendProcessing(.0001);

    let event: IEvent = { type: 'log', reference_id: '123454321' };
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
