import { ExceptionlessClient } from '../../ExceptionlessClient';
import { EventPluginContext } from '../EventPluginContext';
import { DuplicateCheckerPlugin } from './DuplicateCheckerPlugin';
import { expect } from 'chai';

describe('DuplicateCheckerPlugin', () => {
  let now: number = 0;
  let client: ExceptionlessClient;
  let plugin: DuplicateCheckerPlugin;

  beforeEach(() => {
    client = new ExceptionlessClient('LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw', 'http://localhost:50000');
    plugin = new DuplicateCheckerPlugin(() => now, 50);
  });

  function run(exception: Error) {
    let errorParser = client.config.errorParser;
    let context = new EventPluginContext(client, { type: 'error', data: {} });
    context.event.data['@error'] = errorParser.parse(context, exception);

    plugin.run(context);

    return context;
  }

  it('should ignore duplicate within window', (done) => {
    let exception = createException();
    run(exception);

    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).to.be.true;
    setTimeout(() => {

      expect(contextOfSecondRun.event.count).to.equal(1);

      done();
      }, 100);

  });

  it('shouldn\'t ignore error without stack', () => {
    let exception = new ReferenceError('This is a test');
    delete exception.stack;

    run(exception);
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore different stack within window', () => {
    let exception1 = createException();
    run(exception1);
    let exception2 = createException2();
    let contextOfSecondRun = run(exception2);

    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore duplicate after window', () => {
    let exception = createException();
    run(exception);

    now = 3000;
    let contextOfSecondRun = run(exception);
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
