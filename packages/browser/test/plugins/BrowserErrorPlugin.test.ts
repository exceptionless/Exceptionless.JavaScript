
import {
  ErrorInfo,
  Event,
  EventContext,
  EventPluginContext,
  ExceptionlessClient,
  KnownEventDataKeys
} from "@exceptionless/core";

import { CapturedExceptions } from "./../../../core/test/plugins/default/exceptions.js";
import { BrowserErrorPlugin } from "../../src/plugins/BrowserErrorPlugin.js";

class BaseTestError extends Error {
  public name = "NotImplementedError";
  public someProperty = "Test";
}

class DerivedTestError extends BaseTestError {
  public someOtherProperty = "Test2";
}

describe("BrowserErrorPlugin", () => {
  const plugin = new BrowserErrorPlugin();
  let context: EventPluginContext;

  beforeEach(() => {
    plugin.parse = (exception: Error): Promise<ErrorInfo> => {
      return Promise.resolve(<ErrorInfo>{
        type: exception.name,
        message: exception.message,
        stack_trace: [],
        modules: []
      });
    };

    const client: ExceptionlessClient = new ExceptionlessClient();
    const event: Event = {
      data: {}
    };

    context = new EventPluginContext(client, event, new EventContext());
  });

  function processError(error: Error | string | unknown): Promise<void> {
    const exception = throwAndCatch(error);
    context.eventContext.setException(exception);
    return plugin.run(context);
  }

  describe("additional data", () => {
    describeForCapturedExceptions((exception) => {
      test("should ignore default error properties", async () => {
        context.eventContext.setException(exception as Error);
        await plugin.run(context);
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
      expect(additionalData?.someProperty).toBe("Test");
    });

    test("should support custom exception types", async () => {
      await processError(new BaseTestError());
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).not.toBeNull();
      expect(additionalData?.someProperty).toBe("Test");
    });

    test("should support inherited properties", async () => {
      await processError(new DerivedTestError());
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).not.toBeNull();
      expect(additionalData?.someProperty).toBe("Test");
      expect(additionalData?.someOtherProperty).toBe("Test2");
    });

    test("shouldn't set empty additional data", async () => {
      await processError({});
      const additionalData = getAdditionalData(context.event);
      expect(additionalData).toBeUndefined();
    });

    test("should ignore functions", async () => {
      class ErrorWithFunction extends Error {
        constructor() {
          super("Error with function")
        }

        public someFunction(): number {
          return 5;
        }
      }
      const exception = new ErrorWithFunction();
      context.eventContext.setException(exception);

      await plugin.run(context);

      const additionalData = getAdditionalData(context.event);
      expect(additionalData).toBeUndefined();
    });
  });
});

function describeForCapturedExceptions(specDefinitions: (exception: Error | unknown) => void) {
  const keys = Object.getOwnPropertyNames(CapturedExceptions);
  keys.forEach((key) => {
    // @ts-expect-error TS7053
    const exception: unknown = CapturedExceptions[key];
    describe(key, () => specDefinitions(exception));
  });
}

function getError(event: Event): ErrorInfo | undefined {
  return event?.data?.[KnownEventDataKeys.Error];
}

function getAdditionalData(event: Event): Record<string, unknown> | undefined {
  const error = getError(event);
  return error?.data?.["@ext"] as Record<string, unknown>;
}

function throwAndCatch(error: Error | string | unknown): Error {
  try {
    throw error;
  } catch (exception) {
    return exception as Error;
  }
}
