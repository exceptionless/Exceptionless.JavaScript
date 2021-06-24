# Exceptionless Client SDK

This package contains the default implementations that all other JS clients
build upon. You can use it directly but we recommend using one of the packages
below which automatically wire up to platform specific error handlers and
platform specific plugins.

- [`@exceptionless/angularjs`](https://github.com/exceptionless/Exceptionless.JavaScript/tree/master/packages/angularjs)
- [`@exceptionless/browser`](https://github.com/exceptionless/Exceptionless.JavaScript/tree/master/packages/browser)
- [`@exceptionless/node`](https://github.com/exceptionless/Exceptionless.JavaScript/tree/master/packages/node)
- [`@exceptionless/react`](https://github.com/exceptionless/Exceptionless.JavaScript/tree/master/packages/react)
- [`@exceptionless/vue`](https://github.com/exceptionless/Exceptionless.JavaScript/tree/master/packages/vue)

## Getting Started

To use this package, your must be using ES6 and support ESM modules.

## Installation

`npm install @exceptionless/core --save`

## Configuration

While your app is starting up, you should call `startup` on the Exceptionless
client. This ensures the client is configured and automatic capturing of
unhandled errors occurs.

```js
import { Exceptionless } from "@exceptionless/core";

await Exceptionless.startup(c => {
  c.apiKey = "API_KEY_HERE";
  c.setUserIdentity("12345678", "Blake");

  // set some default data
  c.defaultData["mydata"] = {
    myGreeting: "Hello World"
  };

  c.defaultTags.push("Example", "JavaScript");
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
