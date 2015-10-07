import { Configuration } from '../configuration/Configuration';
import { IEvent } from '../models/IEvent';
import { IUserDescription } from '../models/IUserDescription';
import { DefaultSubmissionClient } from './DefaultSubmissionClient';
import { SettingsResponse } from './SettingsResponse';
import { NodeSubmissionRequest, NodeSubmissionCallback, submitRequest } from './NodeSubmissionRequest';
import { SubmissionResponse } from './SubmissionResponse';
import { Utils } from '../Utils';

import http = require('http');
import child = require('child_process');

export class NodeSubmissionClient extends DefaultSubmissionClient {
  constructor() {
    super();
    this.configurationVersionHeader = this.configurationVersionHeader.toLowerCase();
  }

  public sendRequest(config: Configuration, method: string, path: string, data: string, callback: NodeSubmissionCallback): void {
    var request: NodeSubmissionRequest = {
      method,
      path,
      data,
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
      userAgent: config.userAgent
    };

    var exitController = config.exitController;
    if (exitController.isApplicationExiting) {
      this.sendRequestSync(request, callback);
    } else {
      submitRequest(request, callback);
    }
  }

  private sendRequestSync(request: NodeSubmissionRequest, callback: NodeSubmissionCallback): void {
    var requestJson = JSON.stringify(request);
    var res = child.spawnSync(process.execPath, [require.resolve('./submitSync.js')],
      {
        input: requestJson,
        stdio: ['pipe', 'pipe', process.stderr]
      });

    var out = res.stdout.toString();
    var result = JSON.parse(out);

    callback(result.status, result.message, result.data, result.headers);
  }
}
