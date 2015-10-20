import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { ISubmissionAdapter } from './ISubmissionAdapter';
import { DefaultSubmissionClient } from './DefaultSubmissionClient';
import { SubmissionCallback } from './SubmissionCallback';
import { SubmissionRequest } from './SubmissionRequest';

class TestAdapter implements ISubmissionAdapter {
  private request;
  private checks: { (request: SubmissionRequest):void }[] = [];
  private callback:SubmissionCallback;
  private status = 202;
  private message = null;
  private data;
  private headers;

  constructor(check: (request: SubmissionRequest) => void) {
    this.checks.push(check);
  }

  public withResponse(status:number, message:string, data?:string, headers?:any) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.headers = headers;
    return this;
  }

  public withCheck(check: (request: SubmissionRequest) => void) {
    this.checks.push(check);
    return this;
  }

  public sendRequest(request:SubmissionRequest, callback:SubmissionCallback, isAppExiting?:boolean) {
    this.request = request;
    this.callback = callback;

    if (isAppExiting) {
      this.done();
    }
  }

  public done() {
    if (!this.request) {
      fail('sendRequest hasn\'t been called.');
      return;
    }

    this.checks.forEach(c => c(this.request));
    this.callback(this.status, this.message, this.data, this.headers);
  }
}

describe('DefaultSubmissionClient', () => {
  let adapter:TestAdapter;
  let config:Configuration;
  let submissionClient: ISubmissionClient;

  beforeEach(() => {
    let apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
    let serverUrl = 'http://localhost:50000';

    submissionClient = new DefaultSubmissionClient();

    config = new Configuration({
      apiKey,
      serverUrl
    });

    adapter = new TestAdapter(r => {
      expect(r.apiKey).toBe(apiKey);
      expect(r.serverUrl).toBe(serverUrl);
    });

    config.submissionAdapter = adapter;
  });

  it('should submit events', (done) => {
    let events = [{ type: 'log', message: 'From js client', reference_id: '123454321' }];

    adapter.withCheck(r => {
      expect(r.data).toBe(JSON.stringify(events));
      expect(r.method).toBe('POST');
      expect(r.path).toBe('/api/v2/events');
    });

    submissionClient.postEvents(events, config, () => done());

    adapter.done();
  });

  it('should submit invalid object data', (done) => {
    let events:IEvent[] = [{ type: 'log', message: 'From js client', reference_id: '123454321', data: {
      name: 'blake',
      age: function() { throw new Error('Test'); }
    }}];

    adapter.withCheck(r => {
      expect(r.data).toBe(JSON.stringify(events));
      expect(r.method).toBe('POST');
      expect(r.path).toBe('/api/v2/events');
    });

    submissionClient.postEvents(events, config, () => done());

    adapter.done();
  });

  it('should submit user description', (done) => {
    let description:IUserDescription = {
      email_address: 'norply@exceptionless.io',
      description: 'unit test'
    };

    adapter.withCheck(r => {
      expect(r.data).toBe(JSON.stringify(description));
      expect(r.method).toBe('POST');
      expect(r.path).toBe('/api/v2/events/by-ref/123454321/user-description');
    });

    submissionClient.postUserDescription('123454321', description, config, () => done());

    adapter.done();
  });

  it('should get project settings', (done) => {

    adapter.withResponse(200, null, JSON.stringify({ version: 1 }));

    submissionClient.getSettings(config, response => {
      expect(response.success).toBe(true);
      expect(response.message).toBe(null);
      expect(response.settings).not.toBe(null);
      expect(response.settingsVersion).toBeGreaterThan(-1);

      done();
    });

    adapter.done();
  });
});
