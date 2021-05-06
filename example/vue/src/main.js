import { createApp } from "vue";
import App from "./App.vue";
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((c) => {
  c.useDebugLogger();

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
});

createApp(App).mount("#app");
