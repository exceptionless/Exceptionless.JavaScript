import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { Configuration } from '@exceptionless/core/configuration/Configuration';
import { IEvent } from '@exceptionless/core/models/IEvent';
import { IUserDescription } from '@exceptionless/core/models/IUserDescription';
import { DefaultSubmissionClient } from '@exceptionless/core/submission/DefaultSubmissionClient';
import { ISubmissionAdapter } from '@exceptionless/core/submission/ISubmissionAdapter';
import { ISubmissionClient } from '@exceptionless/core/submission/ISubmissionClient';
import { SubmissionCallback } from '@exceptionless/core/submission/SubmissionCallback';
import { SubmissionRequest } from '@exceptionless/core/submission/SubmissionRequest';

class TestAdapter implements ISubmissionAdapter {
  private request: SubmissionRequest;
  private checks: Array<(request: SubmissionRequest) => void> = [];
  private callback: SubmissionCallback;
  private status: number = 202;
  private message: string = null;
  private data: string;
  private headers: Record<string, string>;

  constructor(check: (request: SubmissionRequest) => void) {
    this.checks.push(check);
  }

  public withResponse(status: number, message: string, data?: string, headers?: Record<string, string>) {
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

  public sendRequest(request: SubmissionRequest, callback?: SubmissionCallback, isAppExiting?: boolean) {
    this.request = request;
    this.callback = callback;

    if (isAppExiting) {
      this.done();
    }
  }

  public done() {
    if (!this.request) {
      expect.fail('sendRequest hasn\'t been called.');
      return;
    }

    this.checks.forEach((c) => c(this.request));
    this.callback && this.callback(this.status, this.message, this.data, this.headers);
  }
}

describe('DefaultSubmissionClient', () => {
  let submissionAdapter: TestAdapter;
  let config: Configuration;
  let submissionClient: ISubmissionClient;

  beforeEach(() => {
    const apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
    const serverUrl = 'http://localhost:5000';

    submissionClient = new DefaultSubmissionClient();
    submissionAdapter = new TestAdapter((r) => {
      expect(r.apiKey).to.equal(apiKey);
    });

    config = new Configuration({
      apiKey,
      serverUrl,
      submissionClient,
      submissionAdapter
    });
  });

  it('should submit events', (done) => {
    const events = [{ type: 'log', message: 'From js client', reference_id: '123454321' }];

    submissionAdapter.withCheck((r) => {
      expect(r.data).to.equal(JSON.stringify(events));
      expect(r.method).to.equal('POST');
      expect(r.url).to.equal(`${config.serverUrl}/api/v2/events`);
    });

    submissionClient.postEvents(events, config, () => done());

    submissionAdapter.done();
  });

  it('should submit invalid object data', (done) => {
    const events: IEvent[] = [{
      type: 'log', message: 'From js client', reference_id: '123454321', data: {
        name: 'blake',
        age: () => { throw new Error('Test'); }
      }
    }];

    submissionAdapter.withCheck((r) => {
      expect(r.data).to.equal(JSON.stringify(events));
      expect(r.method).to.equal('POST');
      expect(r.url).to.equal(`${config.serverUrl}/api/v2/events`);
    });

    submissionClient.postEvents(events, config, () => done());
    submissionAdapter.done();
  });

  it('should submit user description', (done) => {
    const description: IUserDescription = {
      email_address: 'norply@exceptionless.io',
      description: 'unit test'
    };

    submissionAdapter.withCheck((r) => {
      expect(r.data).to.equal(JSON.stringify(description));
      expect(r.method).to.equal('POST');
      expect(r.url).to.equal(`${config.serverUrl}/api/v2/events/by-ref/123454321/user-description`);
    });

    submissionClient.postUserDescription('123454321', description, config, () => done());
    submissionAdapter.done();
  });

  it('should get project settings', (done) => {
    submissionAdapter.withResponse(200, null, JSON.stringify({ version: 1 }));

    submissionClient.getSettings(config, 0, (response) => {
      expect(response.success).to.be.true;
      expect(response.message).to.be.null;
      expect(response.settings).not.to.be.null;
      expect(response.settingsVersion).to.be.greaterThan(-1);

      done();
    });

    submissionAdapter.done();
  });
});
