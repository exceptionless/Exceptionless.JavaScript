import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { NodeSubmissionClient } from '../submission/NodeSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { IError } from '../models/IError';
import { Utils } from '../Utils';

function setDefaults() {
  Configuration.defaults.submissionClient = new NodeSubmissionClient();
}

setDefaults();
