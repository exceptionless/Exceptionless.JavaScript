import { Exceptionless, prune } from "../../node_modules/@exceptionless/browser/dist/index.bundle.js";
import "/node_modules/jquery/dist/jquery.js";

import { divide } from "./math.js";
import { TextAreaLogger } from "./text-area-logger.js";

await Exceptionless.startup((c) => {
  c.useDebugLogger();
  c.services.log = new TextAreaLogger("logs", c.services.log);

  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.updateSettingsWhenIdleInterval = 15000;
  c.usePersistedQueueStorage = true;
  c.setUserIdentity("12345678", "Blake");
  c.useSessions();

  // set some default data
  c.defaultData["SampleUser"] = {
    id: 1,
    name: "Blake",
    password: "123456",
    passwordResetToken: "a reset token",
    myPasswordValue: "123456",
    myPassword: "123456",
    customValue: "Password",
    value: {
      Password: "123456",
    },
  };

  c.defaultTags.push("Example", "JavaScript");
  c.settings["@@error:MediaError"] = "Off";
});

document.addEventListener("DOMContentLoaded", () => {
  const elements = document.querySelectorAll(".submit-log");
  for (const element of elements) {
    element.addEventListener("click", (event) => {
      const level = event.target.attributes["data-level"]?.value;
      Exceptionless.submitLog(
        "sendEvents",
        `This is a log message with level: ${level || "<no log level>"}`,
        level
      );
    });
  }

  document
    .querySelector("#submit-error-log-with-error")
    .addEventListener("click", async () => {
      const builder = Exceptionless.createLog("Button Click", "Error Log with Error");
      builder.context.setException(new Error("test"));
      await builder.submit();
    });

  document
    .querySelector("#throw-browser-extension-error")
    .addEventListener("click", () => {
      const error = new Error("A Browser Extension Error");
      error.stack = "at <anonymous>() in chrome-extension://bmagokdooijbeehmkpknfglimnifench/firebug-lite.js:line 9716:col 29"

      throw error;
    });

  document
    .querySelector("#throw-custom-error")
    .addEventListener("click", () => {
      throw new CustomError("A Custom Error", 500);
    });

  document
    .querySelector("#throw-division-by-zero-error")
    .addEventListener("click", () => {
      divide(10, 0);
    });

  document
    .querySelector("#throw-index-out-of-range")
    .addEventListener("click", () => {
      throwIndexOutOfRange();
    });

  document
    .querySelector("#throw-index-out-of-range-custom-stacking")
    .addEventListener("click", () => {
      throwIndexOutOfRange(1, true);
    });

  document
    .querySelector("#throw-string-error")
    .addEventListener("click", () => {
      throwStringError();
    });

  document
    .querySelector("#throw-ignored-error")
    .addEventListener("click", () => {
      throw new MediaError("An Ignored Exception Type");
    });

  document
    .querySelector("#throw-jquery-ajax-error")
    .addEventListener("click", () => {
      $.ajax("http://notexistenturlthrowserror", {
        type: "POST",
        success: (data, textStatus, jqXHR) => {
          console.log({ message: "jQuery.ajax.success", data, textStatus, jqXHR });
        },
        error: (jqXHR, textStatus, errorThrown) => {
          console.log({ message: "jQuery.ajax.error", jqXHR, textStatus, errorThrown });
        }
      });
    });

  document
    .querySelector("#throw-promise-unhandled-rejection")
    .addEventListener("click", () => {
      const promiseFn = () => new Promise(function (_, reject) {
        switch (Math.floor(Math.random() * 4)) {
          case 0:
            reject(0);
            break;
          case 1:
            reject(new Error("Promise rejected error"));
            break;
          case 2:
            reject("Promise rejected string");
            break;
          case 3:
            reject();
            break;
        }
      });

      promiseFn();
    });

  document
    .querySelector("#config-settings-log")
    .addEventListener("click", () => {
      Exceptionless.config.services.log.info(
        JSON.stringify(Exceptionless.config.settings)
      );
    });

  document
    .querySelector("#prune-large-object-benchmark")
    .addEventListener("click", () => {
      const data = {
        str: "hello",
        num: 123,
        bool: true,
        nullVal: null,
        undefinedVal: undefined,
        arr: [
          "foo",
          42,
          {
            prop1: "bar",
            prop2: true,
            prop3: [
              1,
              2,
              {
                nestedProp1: "baz",
                nestedProp2: false,
                nestedObj: {}
              }
            ]
          }
        ],
        person: {
          name: "John",
          age: 30,
          address: {
            street: "123 Main St",
            city: "Anytown",
            state: "TX",
            country: {
              name: "United States",
              region: {
                north: {
                  name: "North Region",
                  states: ["New York", "Vermont", "New Hampshire", "Maine"]
                },
                south: {
                  name: "South Region",
                  states: ["Texas", "Florida", "Georgia", "North Carolina"]
                },
                east: {
                  name: "East Region",
                  states: ["New York", "Massachusetts", "Connecticut", "New Jersey"]
                },
                west: {
                  name: "West Region",
                  states: ["California", "Oregon", "Washington", "Arizona"]
                }
              }
            }
          }
        },
        func: function (x) {
          return x * 2;
        },
        date: new Date(),
        regex: /foo(bar)?/i,
        symbol: Symbol("my symbol"),
        bigint: 9007199254740991n,
        map: new Map([
          [{ id: 1 }, "value associated with an object key"],
          ["string key", "value associated with a string key"],
          [123, "value associated with a number key"],
          [Symbol("symbol key"), "value associated with a symbol key"]
        ]),
        set: new Set(["foo", 42, { prop: "value" }])
      };

      const { log } = Exceptionless.config.services;
      log.info("Starting pruning of large object");

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        prune(data, 3);
      }
      const end = performance.now();

      log.info(`Pruning large object took ${end - start} milliseconds`);
    });
});

async function throwIndexOutOfRange(indexer, withCustomStacking) {
  try {
    getNonexistentData(indexer);
  } catch (e) {
    if (withCustomStacking) {
      if (Math.random() < 0.5) {
        await Exceptionless.createException(e)
          .setManualStackingKey("MyCustomStackingKey")
          .submit();
      } else {
        await Exceptionless.createException(e)
          .setManualStackingInfo(
            {
              File: "index.js",
              Function: "throwIndexOutOfRange",
            },
            "Custom Index Out Of Range Exception"
          )
          .submit();
      }
    } else {
      await Exceptionless.submitException(e);
    }
  }
}

function getNonexistentData(...args) {
  /* random comment */ nonexistentArray[args[0]]; // second random comment;
}

function throwStringError() {
  return throwStringErrorImpl("string error message");
}

function throwStringErrorImpl(message) {
  throw message;
}

class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "CustomError";
    this.code = code; // Extra property;
  }

  getValue() {
    return 5;
  }

  getPromiseValue() {
    return new Promise((r) => r({ expensive: "call" }));
  }

  get getThrowsError() {
    throw new Error("Not Implemented");
  }
}
