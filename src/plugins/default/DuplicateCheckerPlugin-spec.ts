import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';
import { DuplicateCheckerPlugin } from './DuplicateCheckerPlugin';
import { ErrorPlugin } from './ErrorPlugin';
import { createFixture } from './EventPluginTestFixture';
import { expect } from 'chai';

describe('DuplicateCheckerPlugin', () => {
  let now: number = 0;
  let plugin: DuplicateCheckerPlugin;

  beforeEach(() => {
    plugin = new DuplicateCheckerPlugin(() => now);
  });

  function run(exception: Error) {
    let context: EventPluginContext;
    let contextData: ContextData;
    ({
      context,
      contextData
    } = createFixture());

    contextData.setException(exception);

    let errorPlugin = new ErrorPlugin();
    errorPlugin.run(context);
    plugin.run(context);

    return context;
  }

  it('should ignore duplicate within window', () => {
    let exception = createException([{
      name: 'methodA'
    }]);
    run(exception);
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).to.be.true;
  });

  it('shouldn\'t ignore error without stack', () => {
    let exception = createException();
    run(exception);
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore different stack within window', () => {
    let exception1 = createException([{
      name: 'methodA'
    }]);
    run(exception1);
    let exception2 = createException([{
      name: 'methodB'
    }]);
    let contextOfSecondRun = run(exception2);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });

  it('shouldn\'t ignore duplicate after window', () => {
    let exception = createException([{
      name: 'methodA'
    }]);
    run(exception);

    now = 3000;
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).not.to.be.true;
  });
});

function createException(stack?) {
  try {
    throw new Error();
  } catch (e) {
    e.testStack = stack;
    return e;
  }
}
