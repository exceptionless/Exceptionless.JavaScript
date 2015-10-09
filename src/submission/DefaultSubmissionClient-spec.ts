import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { ISubmissionClient } from './ISubmissionClient';
import { DefaultSubmissionClient } from './DefaultSubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { SubmissionResponse } from './SubmissionResponse';

describe('DefaultSubmissionClient', () => {
  it('should submit events', (done) => {
    function processResponse(response:SubmissionResponse) {
      if (response.success) {
        expect(response.message).toBe(null);
      } else {
        expect(response.message).toBe('Unable to connect to server.');
      }

      done();
    }

    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    var submissionClient = new DefaultSubmissionClient();
    submissionClient.postEvents([{ type: 'log', message: 'From js client', reference_id: '123454321' }], config, processResponse);
  }, 5000);

  it('should submit invalid object data', (done) => {
    function processResponse(response:SubmissionResponse) {
      if (response.success) {
        expect(response.message).toBe(null);
      } else {
        expect(response.message).toBe('Unable to connect to server.');
      }

      done();
    }

    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    var event:IEvent = { type: 'log', message: 'From js client', reference_id: '123454321', data: {
      name: 'blake',
      age: function() { throw new Error('Test'); }
    }};

    var submissionClient = new DefaultSubmissionClient();
    submissionClient.postEvents([event], config, processResponse);
  }, 5000);

  it('should submit user description', (done) => {
    function processResponse(response:SubmissionResponse) {
      if (response.success) {
        expect(response.message).toBe(null);
      } else {
        expect(response.message).toBe('Unable to connect to server.');
      }

      done();
    }

    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    var submissionClient = new DefaultSubmissionClient();
    submissionClient.postUserDescription('123454321', { email_address: 'norply@exceptionless.io', description: 'unit test' }, config, processResponse)
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

      done();
    }

    var config = new Configuration({ apiKey:'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', serverUrl:'http://localhost:50000'});
    var submissionClient = new DefaultSubmissionClient();
    submissionClient.getSettings(config, processResponse);
  }, 5000);
});
