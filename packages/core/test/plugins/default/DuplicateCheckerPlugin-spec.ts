import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { ExceptionlessClient } from 'src/ExceptionlessClient';
import { EventPluginContext } from 'src/plugins/EventPluginContext';
import { DuplicateCheckerPlugin } from 'src/plugins/default/DuplicateCheckerPlugin';
import { IInnerError } from "src/models/IInnerError";
import { IStackFrame } from "src/models/IStackFrame";

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
    const exception = createException();
    run(exception);

    const contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).to.be.true;
    setTimeout(() => {
      expect(contextOfSecondRun.event.count).to.equal(1);

      done();
    }, 100);
  });

  it('should ignore error without stack', () => {
    const exception = new ReferenceError('This is a test');
    delete exception.stack;

    run(exception);
    const contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).to.be.true;
  });

  it('shouldn\'t ignore different stack within window', () => {
    const exception1 = createException();
    run(exception1);
    const exception2 = createException2();
    const contextOfSecondRun = run(exception2);

    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore duplicate after window', () => {
    const exception = createException();
    run(exception);

    now = 3000;
    const contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });
});

function createException() {
  function throwError() {
    throw new ReferenceError('This is a test');
  }
  try {
    throwError();
  } catch (e) {
    return e;
  }
}

function createException2() {
  function throwError2() {
    throw new ReferenceError('This is a test');
  }
  try {
    throwError2();
  } catch (e) {
    return e;
  }
}
