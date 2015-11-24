import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';
import { IEvent } from '../../models/IEvent';

import { ErrorPlugin } from './ErrorPlugin';
import { CapturedExceptions } from './ErrorPlugin-spec-exceptions';
import { createFixture } from './EventPluginTestFixture';
import { expect } from 'chai';

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
  let target = new ErrorPlugin();
  let contextData: ContextData;
  let context: EventPluginContext;
  let client: any;
  let event: IEvent;

  beforeEach(() => {
    ({
      contextData,
      context,
      client,
      event
    } = createFixture());
  });

  function processError(error) {
    let exception = throwAndCatch(error);
    contextData.setException(exception);
    target.run(context);
  }

  describe('additional data', () => {
    describeForCapturedExceptions((exception) => {
      it('should ignore default error properties', () => {
        contextData.setException(exception);
        target.run(context);
        let additionalData = getAdditionalData(event);
        expect(additionalData).to.be.null;
      });

    });

    it('should add custom properties to additional data', () => {
      let error = {
        someProperty: 'Test'
      };
      processError(error);
      let additionalData = getAdditionalData(event);
      expect(additionalData).not.to.be.null;
      expect(additionalData.someProperty).to.equal('Test');
    });

    it('should support custom exception types', () => {
      processError(new BaseTestError());
      let additionalData = getAdditionalData(event);
      expect(additionalData).not.to.be.null;
      expect(additionalData.someProperty).to.equal('Test');
    });

    it('should support inherited properties', () => {
      processError(new DerivedTestError());
      let additionalData = getAdditionalData(event);
      expect(additionalData).not.to.be.null;
      expect(additionalData.someProperty).to.equal('Test');
      expect(additionalData.someOtherProperty).to.equal('Test2');
    });

    it('shouldn\'t set empty additional data', () => {
      processError({});
      let additionalData = getAdditionalData(event);
      expect(additionalData).to.be.null;
    });

    it('should ignore functions', () => {
      let exception: any = new Error('Error with function');
      exception.someFunction = () => { };
      contextData.setException(exception);

      target.run(context);

      let additionalData = getAdditionalData(event);
      expect(additionalData).to.be.null;
    });
  });
});

function describeForCapturedExceptions(specDefinitions: (exception: any) => void) {
  let keys = Object.getOwnPropertyNames(CapturedExceptions);
  keys.forEach(key => {
    let exception = CapturedExceptions[key];
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
  let error = getError(event);
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
