## Exceptionless Browser

This package provides native JavaScript support for applications that are built in vanilla HTML and JS. 

### Installation  

**Package Managers** 

`npm install @exceptionless/browser`

or

`yarn add @exceptionless/browser`  


### Configuration 

```js
await Exceptionless.startup(c => {
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
      Password: "123456"
    }
  };

  c.defaultTags.push("Example", "JavaScript");
  c.settings["@@error:MediaError"] = "Off"
});
```
