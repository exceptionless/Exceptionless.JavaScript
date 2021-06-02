import { DuplicateCheckerPlugin } from "../../../src/plugins/default/DuplicateCheckerPlugin.js";
import { ExceptionlessClient } from "../../../src/ExceptionlessClient.js";
import { EventPluginContext } from "../../../src/plugins/EventPluginContext.js";
import {
  InnerErrorInfo,
  StackFrameInfo
} from "../../../src/models/data/ErrorInfo.js";
import { delay } from "../../helpers.js";
import { EventContext } from "../../../src/models/EventContext.js";

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

describe("DuplicateCheckerPlugin", () => {
  let now: number = 0;
  let client: ExceptionlessClient;
  let plugin: DuplicateCheckerPlugin;

  beforeEach(() => {
    client = new ExceptionlessClient();
    plugin = new DuplicateCheckerPlugin(() => now, 50);
  });

  const run = async(stackTrace?: StackFrameInfo[]): Promise<EventPluginContext> => {
    // TODO: Generate unique stack traces based on test data.
    const context = new EventPluginContext(client, {
      type: "error",
      data: {
        "@error": <InnerErrorInfo>{
          type: "ReferenceError",
          message: "This is a test",
          stack_trace: stackTrace
        }
      }
    }, new EventContext());

    await plugin.run(context);
    return context;
  }

  test("should ignore duplicate within window", async () => {
    await run(Exception1StackTrace);

    const contextOfSecondRun = await run(Exception1StackTrace);
    expect(contextOfSecondRun.cancelled).toBe(true);
    await delay(100);
    setTimeout(() => {
      expect(contextOfSecondRun.event.count).toBe(1);

    }, 100);
  });

  test("should ignore error without stack", async () => {
    await run();
    const contextOfSecondRun = await run();
    expect(contextOfSecondRun.cancelled).toBe(true);
  });

  test("shouldn't ignore different stack within window", async () => {
    await run(Exception1StackTrace);
    const contextOfSecondRun = await run(Exception2StackTrace);

    expect(contextOfSecondRun.cancelled).not.toBe(true);
  });

  test("shouldn't ignore duplicate after window", async () => {
    await run(Exception1StackTrace);

    now = 3000;
    const contextOfSecondRun = await run(Exception1StackTrace);
    expect(contextOfSecondRun.cancelled).not.toBe(true);
  });
});
