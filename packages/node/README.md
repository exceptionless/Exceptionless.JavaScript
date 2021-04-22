## Exceptionless NodeJS

Using Exceptionless in the NodeJS environment is similar to using it in other JavaScript environments. 

### Installation 

Using npm: 

`npm i @exceptionless/node`

Using yarn: 

`yarn add @exceptionless/node` 

### Configuration 

When your NodeJS app starts up, it should tell the Exceptionless client to startup like this: 

```js
await Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.useDebugLogger();

  c.defaultTags.push("Example", "Node");

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
});
```

Once that's done, you can use the Exceptionless client anywhere in your app by calling `Exceptionless` followed by the method you want to use. For example: 

```js
Exceptionless.submitLog("Hello, world");
```

### Using With Express 

When using this package with an Express server, you should call `exceptionless.startup()` when the server starts. There are many ways to do this, but it's important that the client is instantiated before the server is used. 
