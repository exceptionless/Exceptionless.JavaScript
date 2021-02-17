import { Configuration } from "../../src/configuration/Configuration.js";
import { IEvent } from "../../src/models/IEvent.js";
import { IUserDescription } from "../../src/models/IUserDescription.js";
import { DefaultSubmissionClient } from "../../src/submission/DefaultSubmissionClient.js";
import { ISubmissionClient } from "../../src/submission/ISubmissionClient.js";

import { TestSubmissionAdapter } from "./TestSubmissionAdapter.js";

describe('DefaultSubmissionClient', () => {
  let submissionAdapter: TestSubmissionAdapter;
  let config: Configuration;
  let submissionClient: ISubmissionClient;

  beforeEach(() => {
    const apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
    const serverUrl = 'http://localhost:5000';

    submissionClient = new DefaultSubmissionClient();
    submissionAdapter = new TestSubmissionAdapter((r) => {
      expect(r.apiKey).toBe(apiKey);
    });

    config = new Configuration({
      apiKey,
      serverUrl,
      submissionClient,
      submissionAdapter
    });
  });

  test('should submit events', done => {
    const events = [{ type: 'log', message: 'From js client', reference_id: '123454321' }];

    submissionAdapter.withCheck((r) => {
      expect(r.data).toBe(JSON.stringify(events));
      expect(r.method).toBe('POST');
      expect(r.url).toBe(`${config.serverUrl}/api/v2/events`);
    });

    submissionClient.postEvents(events, config, () => done());

    submissionAdapter.done();
  });

  test('should submit invalid object data', done => {
    const events: IEvent[] = [{
      type: 'log', message: 'From js client', reference_id: '123454321', data: {
        name: 'blake',
        age: () => { throw new Error('Test'); }
      }
    }];

    submissionAdapter.withCheck((r) => {
      expect(r.data).toBe(JSON.stringify(events));
      expect(r.method).toBe('POST');
      expect(r.url).toBe(`${config.serverUrl}/api/v2/events`);
    });

    submissionClient.postEvents(events, config, () => done());
    submissionAdapter.done();
  });

  test('should submit user description', done => {
    const description: IUserDescription = {
      email_address: 'norply@exceptionless.io',
      description: 'unit test'
    };

    submissionAdapter.withCheck((r) => {
      expect(r.data).toBe(JSON.stringify(description));
      expect(r.method).toBe('POST');
      expect(r.url).toBe(`${config.serverUrl}/api/v2/events/by-ref/123454321/user-description`);
    });

    submissionClient.postUserDescription('123454321', description, config, () => done());
    submissionAdapter.done();
  });

  test('should get project settings', done => {
    submissionAdapter.withResponse(200, null, JSON.stringify({ version: 1 }));

    submissionClient.getSettings(config, 0, (response) => {
      expect(response.success).toBe(true);
      expect(response.message).toBeNull();
      expect(response.settings).not.toBeNull();
      expect(response.settingsVersion).toBeGreaterThan(-1);

      done();
    });

    submissionAdapter.done();
  });
});
