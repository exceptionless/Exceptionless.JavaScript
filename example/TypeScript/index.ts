import { Exceptionless } from "@exceptionless/browser";

Exceptionless.startup({
  serverUrl: "http://localhost:5000",
});

Exceptionless.config.useDebugLogger();

// set some default data
Exceptionless.config.defaultData["SampleUser"] = {
  id:1,
  name: "Blake",
  password: "123456",
  passwordResetToken: "a reset token",
  myPasswordValue: "123456",
  myPassword: "123456",
  customValue: "Password",
  value: {
    Password: "123456"
  }
};

Exceptionless.config.defaultTags.push("Example", "JavaScript", "TypeScript");
Exceptionless.submitLog("Testing");
