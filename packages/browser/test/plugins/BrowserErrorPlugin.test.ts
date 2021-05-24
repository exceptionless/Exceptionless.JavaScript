import { BrowserErrorPlugin } from "../../src/plugins/BrowserErrorPlugin.js";
import { EventPluginContext } from "./../../../core/src/plugins/EventPluginContext.js";
import { Event, KnownEventDataKeys } from "./../../../core/src/models/Event.js";
import { CapturedExceptions } from "./../../../core/test/plugins/default/exceptions.js";
import { ErrorInfo } from "./../../../core/src/models/data/ErrorInfo.js";

function BaseTestError() {
  this.name = "NotImplementedError";
  this.someProperty = "Test";
}

BaseTestError.prototype = new Error();

function DerivedTestError() {
  this.someOtherProperty = "Test2";
}

DerivedTestError.prototype = new BaseTestError();

describe("BrowserErrorPlugin", () => {
  const target = new BrowserErrorPlugin();
  let context: EventPluginContext;

  beforeEach(() => {
    (context = createFixture());
  });

  function processError(error): Promise<void> {
    const exception = throwAndCatch(error);
    context.eventContext.setException(exception);
    return target.run(context);
  }

  describe("additional data", () => {
    describeForCapturedExceptions((exception) => {
      test("should ignore default error properties", async () => {
        context.eventContext.setException(exception);
        await target.run(context);
        const additionalData = getAdditionalData(context.event);
        expect(additionalData).toBeUndefined();
      });
    });

    test("should add custom properties to additional data", async () => {
      const error = {
        someProperty: "Test"
      };
      await processError(error);
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe("Test");
    });

    test("should support custom exception types", async () => {
      await processError(new BaseTestError());
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe("Test");
    });

    test("should support inherited properties", async () => {
      await processError(new DerivedTestError());
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).not.toBeNull();
      expect(additionalData.someProperty).toBe("Test");
      expect(additionalData.someOtherProperty).toBe("Test2");
    });

    test("shouldn't set empty additional data", async () => {
      await processError({});
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).toBeUndefined();
    });

    test("should ignore functions", async () => {
      const exception: any = new Error("Error with function");
      exception.someFunction = () => { };
      context.eventContext.setException(exception);

      await target.run(context);

      const additionalData = getAdditionalData(context.event);
      expect(additionalData).toBeUndefined();
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

function getError(event: Event): ErrorInfo {
  return event?.data?.[KnownEventDataKeys.Error];
}

function getAdditionalData(event: Event): any {
  const error = getError(event);
  return error?.data?.["@ext"];
}

function throwAndCatch(error: any): Error {
  try {
    throw error;
  } catch (exception) {
    return exception;
  }
}

function createFixture(): EventPluginContext {
  const errorParser: IErrorParser = {
    parse: (c: EventPluginContext, exception: Error) => Promise.resolve({
      type: exception.name,
      message: exception.message,
      stack_trace: null
    })
  };
  const client: ExceptionlessClient = new ExceptionlessClient();
  client.config.services.errorParser = errorParser;

  const event: Event = {
    data: {}
  };

  return new EventPluginContext(client, event);
}
