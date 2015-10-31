import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';
import { IEvent } from '../../models/IEvent';
import { IErrorParser } from '../../services/IErrorParser';

import { ErrorPlugin } from './ErrorPlugin';
import { CapturedExceptions } from './ErrorPlugin-spec-exceptions';

describe('ErrorPlugin', () => {

  let target = new ErrorPlugin();
  let contextData: ContextData;
  let context: EventPluginContext;
  let errorParser: IErrorParser;
  let client: any;
  let event: IEvent;

  beforeEach(() => {
    errorParser = {
      parse: (c: EventPluginContext, exception: Error) => ({
        type: exception.name,
        message: exception.message
      })
    };
    client = {
      config: {
        errorParser
      }
    };
    event = {
      data: {}
    };
    contextData = new ContextData();
    context = new EventPluginContext(client, event, contextData);
  });

  describe('additional properties', () => {

    describeForCapturedExceptions((exception) => {
      beforeEach(() => {
        contextData.setException(exception);
      });

      it('should ignore default error properties', () => {
        target.run(context);
        let error = event.data['@error'];
        expect(error).toBeDefined();
        expect(error.data && error.data['@ext']).toBeFalsy();
      });
    });

    it('should support custom exception types', () => {
      function NotImplementedError() {
        this.name = 'NotImplementedError';
        this.someProperty = 'Test';
      }

      NotImplementedError.prototype = Error.prototype;
      contextData.setException(new NotImplementedError());

      target.run(context);

      let error = event.data['@error'];
      expect(error.data['@ext'].someProperty).toBe('Test');
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
