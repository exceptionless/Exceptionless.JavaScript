import { expect } from 'chai';
import * as sinon from 'sinon';
import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { SubmissionResponse } from '../submission/SubmissionResponse';

describe('DefaultEventQueue', () => {

  let config: Configuration;
  let xhr: any;

  beforeEach(() => {
    xhr = sinon.useFakeXMLHttpRequest();

    config = getConfiguration();
  });

  afterEach(() => {
    const queue =  config.queue as any;
    clearInterval(queue._queueTimer);
    config = null;
    xhr.restore();
  });

  function getConfiguration(): Configuration {
    const result: Configuration = new Configuration({
      apiKey: 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw',
      serverUrl: 'http://localhost:50000'
    });

    expect(result.storage.queue.get().length).to.equal(0);
    return result;
  }

  it('should enqueue event', () => {
    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);
  });

  it('should process queue', () => {
    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);
    config.queue.process();

    config.queue.onEventsPosted((events: IEvent[], response: SubmissionResponse) => {
      expect(( config.queue as any)._suspendProcessingUntil).to.be.undefined;

      expect(config.storage.queue.get().length).to.equal(0);
    });
  });

  it('should discard event submission', () => {
    config.queue.suspendProcessing(1, true);

    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(0);
  });

  it('should suspend processing', (done) => {
    config.queue.suspendProcessing(.0001);

    const event: IEvent = { type: 'log', reference_id: '123454321' };
    config.queue.enqueue(event);
    expect(config.storage.queue.get().length).to.equal(1);

    setTimeout(() => {
      if (!( config.queue as any)._suspendProcessingUntil) {
        expect(config.storage.queue.get().length).to.equal(0);
      } else {
        expect(config.storage.queue.get().length).to.equal(1);
      }

      done();
    });
  });
});
