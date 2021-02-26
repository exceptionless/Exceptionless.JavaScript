import { Configuration } from "../../src/configuration/Configuration.js";
import { IEvent } from "../../src/models/IEvent.js";
import { delay } from "../../src/Utils.js";

describe('DefaultEventQueue', () => {
  let config: Configuration;

  beforeEach(() => {
    config = new Configuration({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:5000'
    });

    expect(config.storage.queue.get().length).toBe(0);
  });

  afterEach(() => {
    const queue: any = config.queue;
    clearInterval(queue._queueTimer);
    config = null;
  });

  test('should enqueue event', () => {
    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).toBe(1);
  });

  test('should process queue', () => {
    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).toBe(1);
    config.queue.process();

    config.queue.onEventsPosted(() => {
      expect((config.queue as any)._suspendProcessingUntil).toBeUndefined();
      expect(config.storage.queue.get().length).toBe(0);
    });
  });

  test('should discard event submission', () => {
    config.queue.suspendProcessing(1, true);

    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).toBe(0);
  });

  test('should suspend processing', async () => {
    config.queue.suspendProcessing(.0001);

    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).toBe(1);

    await delay(25);
    if (!(config.queue as any)._suspendProcessingUntil) {
      expect(config.storage.queue.get().length).toBe(0);
    } else {
      expect(config.storage.queue.get().length).toBe(1);
    }
  });
});
