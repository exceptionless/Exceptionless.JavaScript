import { ContextData } from "../../../src/plugins/ContextData.js";
import { ErrorPlugin } from "../../../src/plugins/default/ErrorPlugin.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import { IEvent } from "../../../src/models/IEvent.js";

import { CapturedExceptions } from './exceptions.js';
import { createFixture } from './EventPluginTestFixture.js';

function BaseTestError() {
  this.name = 'NotImplementedError';
  this.someProperty = 'Test';
}

BaseTestError.prototype = new Error();

function DerivedTestError() {
  this.someOtherProperty = 'Test2';
}

DerivedTestError.prototype = new BaseTestError();

describe('ErrorPlugin', () => {
  const target = new ErrorPlugin();
  let contextData: ContextData;
  let context: EventPluginContext;
  let event: IEvent;

  beforeEach(() => {
    ({
      contextData,
      context,
      event
    } = createFixture());
  });

  function processError(error): Promise<void> {
    const exception = throwAndCatch(error);
    contextData.setException(exception);
    return target.run(context);
  }

  describe('additional data', () => {
    describeForCapturedExceptions((exception) => {
      test('should ignore default error properties', async () => {
        contextData.setException(exception);
        await target.run(context);
        const additionalData = getAdditionalData(event);
        expect(additionalData).toBeNull();
      });

    });

    test('should add custom properties to additional data', async () => {
      const error = {
        someProperty: 'Test'
      };
      await processError(error);
      const additionalData = getAdditionalData(event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe('Test');
    });

    test('should support custom exception types', async () => {
      await processError(new BaseTestError());
      const additionalData = getAdditionalData(event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe('Test');
    });

    test('should support inherited properties', async () => {
      await processError(new DerivedTestError());
      const additionalData = getAdditionalData(event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe('Test');
      expect(additionalData.someOtherProperty).toBe('Test2');
    });

    test('shouldn\'t set empty additional data', async () => {
      await processError({});
      const additionalData = getAdditionalData(event);
      expect(additionalData).toBeNull();
    });

    test('should ignore functions', async () => {
      const exception: any = new Error('Error with function');
      exception.someFunction = () => { };
      contextData.setException(exception);

      await target.run(context);

      const additionalData = getAdditionalData(event);
      expect(additionalData).toBeNull();
    });
  });
});

function describeForCapturedExceptions(specDefinitions: (exception: any) => void) {
  const keys = Object.getOwnPropertyNames(CapturedExceptions);
  keys.forEach((key) => {
    const exception = CapturedExceptions[key];
    describe(key, () => { specDefinitions(exception); });
  });
}

function getError(event: IEvent) {
  if (event && event.data && event.data['@error']) {
    return event.data['@error'];
  }
  return null;
}

function getAdditionalData(event: IEvent) {
  const error = getError(event);
  if (error && error.data && error.data['@ext']) {
    return error.data['@ext'];
  }
  return null;
}

function throwAndCatch(error: any): Error {
  try {
    throw error;
  } catch (exception) {
    return exception;
  }
}
