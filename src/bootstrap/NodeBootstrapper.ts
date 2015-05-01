import { IBootstrapper } from 'IBootstrapper';
import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { IError } from '../models/IError';
import { NodeSubmissionClient } from '../submission/NodeSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { Utils } from '../Utils';

export class NodeBootstrapper implements IBootstrapper {
  public register(): void {
    if (!this.isNode()) {
      return;
    }

    Configuration.defaults.submissionClient = new NodeSubmissionClient();
  }

  private isNode(): boolean {
    return !window && typeof global !== "undefined" && {}.toString.call(global) === '[object global]';
  }
}
