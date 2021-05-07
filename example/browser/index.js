import { Exceptionless } from "../../node_modules/@exceptionless/browser/dist/index.min.js";
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
    .querySelector("#config-settings-log")
    .addEventListener("click", () => {
      Exceptionless.config.services.log.info(
        JSON.stringify(Exceptionless.config.settings)
      );
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
