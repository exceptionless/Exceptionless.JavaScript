import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { ExceptionlessClient } from '../../../src/ExceptionlessClient';
import { EventPluginContext } from '../../../src/plugins/EventPluginContext';
import { DuplicateCheckerPlugin } from '../../../src/plugins/default/DuplicateCheckerPlugin';
import { IInnerError } from "../../../src/models/IInnerError";
import { IStackFrame } from "../../../src/models/IStackFrame";

const Exception1StackTrace = [
  {
    file_name: "index.js",
    line_number: 0,
    column: 50,
    is_signature_target: true,
    name: "createException",
  },
  {
    file_name: "index.js",
    line_number: 5,
    column: 25,
    is_signature_target: false,
    name: "throwError",
  }
];

const Exception2StackTrace = [
  {
    file_name: "index.js",
    line_number: 0,
    column: 50,
    is_signature_target: true,
    name: "createException2",
  },
  {
    file_name: "index.js",
    line_number: 5,
    column: 25,
    is_signature_target: false,
    name: "throwError2",
  }
];

describe('DuplicateCheckerPlugin', () => {
  let now: number = 0;
  let client: ExceptionlessClient;
  let plugin: DuplicateCheckerPlugin;

  beforeEach(() => {
    client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:5000');
    plugin = new DuplicateCheckerPlugin(() => now, 50);
  });

  function run(stackTrace?: IStackFrame[]) {
    // TODO: Generate unique stack traces based on test data.
    const context = new EventPluginContext(client, {
      type: 'error',
      data: {
        '@error': <IInnerError>{
          type: 'ReferenceError',
          message: 'This is a test',
          stack_trace: stackTrace
        }
      }
    });

    plugin.run(context);
    return context;
  }

  it('should ignore duplicate within window', (done) => {
    run(Exception1StackTrace);

    const contextOfSecondRun = run(Exception1StackTrace);
    expect(contextOfSecondRun.cancelled).to.be.true;
    setTimeout(() => {
      expect(contextOfSecondRun.event.count).to.equal(1);

      done();
    }, 100);
  });

  it('should ignore error without stack', () => {
    run();
    const contextOfSecondRun = run();
    expect(contextOfSecondRun.cancelled).to.be.true;
  });

  it('shouldn\'t ignore different stack within window', () => {
    run(Exception1StackTrace);
    const contextOfSecondRun = run(Exception2StackTrace);

    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore duplicate after window', () => {
    run(Exception1StackTrace);

    now = 3000;
    const contextOfSecondRun = run(Exception1StackTrace);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });
});