import { IBootstrapper } from 'IBootstrapper';
import { Configuration } from '../configuration/Configuration';
import { IConfigurationSettings } from '../configuration/IConfigurationSettings';
import { IError } from '../models/IError';
import { NodeEnvironmentInfoCollector } from '../services/NodeEnvironmentInfoCollector';
import { NodeErrorParser } from '../services/NodeErrorParser';
import { NodeRequestInfoCollector } from '../services/NodeRequestInfoCollector';
import { NodeSubmissionClient } from '../submission/NodeSubmissionClient';
import { ExceptionlessClient } from '../ExceptionlessClient';
import { Utils } from '../Utils';

export class NodeBootstrapper implements IBootstrapper {
  public register(): void {
    const beforeExit:string = 'beforeExit';
    const uncaughtException:string = 'uncaughtException';

    if (!(typeof window === 'undefined' && typeof global !== 'undefined' && {}.toString.call(global) === '[object global]')) {
      return;
    }

    var defaults = Configuration.defaults;
    defaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
    defaults.errorParser = new NodeErrorParser();
    defaults.requestInfoCollector = new NodeRequestInfoCollector();
    defaults.submissionClient = new NodeSubmissionClient();

    process.on(uncaughtException, function (error:Error) {
      ExceptionlessClient.default.submitUnhandledException(error, uncaughtException);
    });

    process.on(beforeExit, function (code:number) {
      /**
       * exit codes: https://nodejs.org/api/process.html#process_event_exit
       */
      function  getExitCodeReason(code:number): string {
        if (code === 1) {
          return 'Uncaught Fatal Exception';
        }

        if (code === 3) {
          return 'Internal JavaScript Parse Error';
        }

        if (code === 4) {
          return 'Internal JavaScript Evaluation Failure';
        }

        if (code === 5) {
          return 'Fatal Exception';
        }

        if (code === 6) {
          return 'Non-function Internal Exception Handler ';
        }

        if (code === 7) {
          return 'Internal Exception Handler Run-Time Failure';
        }

        if (code === 8) {
          return 'Uncaught Exception';
        }

        if (code === 9) {
          return 'Invalid Argument';
        }

        if (code === 10) {
          return 'Internal JavaScript Run-Time Failure';
        }

        if (code === 12) {
          return 'Invalid Debug Argument';
        }

        if (code > 128) {
          return 'Signal Exits';
        }

        return null;
      }

      var client = ExceptionlessClient.default;
      var message = getExitCodeReason(code);
      if (message !== null) {
        client.submitLog(beforeExit, message, 'Error')
      }

      client.config.queue.process()
    });
  }
}
