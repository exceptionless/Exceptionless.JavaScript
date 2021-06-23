# Exceptionless NodeJS

Using Exceptionless in the NodeJS environment is similar to using it in other
JavaScript environments.

## Getting Started

To use this package, your must be using ES6 and Node 15+.

## Installation

`npm install @exceptionless/node --save`

## Configuration

While your app is starting up, you should call `startup` on the Exceptionless
client. This ensures the client is configured and automatic capturing of
unhandled errors occurs.

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.startup(c => {
  c.apiKey = "API_KEY_HERE";
  c.usePersistedQueueStorage = true;
  c.setUserIdentity("12345678", "Blake");
  c.useSessions();

  // set some default data
  c.defaultData["mydata"] = {
    myGreeting: "Hello World"
  };

c.defaultTags.push("Example", "JavaScript", "Node");
});
```

Once that's done, you can use the Exceptionless client anywhere in your app by
importing `Exceptionless` followed by the method you want to use. For example:

```js
await Exceptionless.submitLog("Hello world!");
```

Please see the [docs](https://exceptionless.com/docs/clients/javascript/) for
more information on configuring the client.

## Support

If you need help, please contact us via in-app support,
[open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new)
or [join our chat on Discord](https://discord.gg/6HxgFCx). We’re always here to
help if you have any questions!
