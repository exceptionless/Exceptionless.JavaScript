import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';
import { DuplicateCheckerPlugin } from './DuplicateCheckerPlugin';
import { ErrorPlugin } from './ErrorPlugin';
import { createFixture } from './EventPluginTestFixture';

describe('DuplicateCheckerPlugin', () => {

  let target: DuplicateCheckerPlugin;
  let now: number;

  beforeEach(() => {
    target = new DuplicateCheckerPlugin();
    (<any>target).getNow = () => now;
    now = 0;
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
    target.run(context);

    return context;
  }

  it('should ignore duplicate within window', () => {
    let exception = createException([{
      name: 'methodA'
    }]);
    run(exception);
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).toBeTruthy();
  });

  it('shouldn\'t ignore error without stack', () => {
    let exception = createException();
    run(exception);
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).toBeFalsy();
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
    expect(contextOfSecondRun.cancelled).toBeFalsy();
  });

  it('shouldn\'t ignore duplicate after window', () => {
    let exception = createException([{
      name: 'methodA'
    }]);
    run(exception);

    now = 3000;
    let contextOfSecondRun = run(exception);
    expect(contextOfSecondRun.cancelled).toBeFalsy();
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
