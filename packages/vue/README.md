# Exceptionless vue

The Exceptionless Vue package provides a native way to handle errors and events
in Vue. This means errors inside your components, which tend to crash your
entire app, can be sent to Exceptionless and you can be alerted. Additionally,
you can use this package to catch errors throughout your non-component functions
such as in utility functions, etc.

## Getting Started

To use this package, your must be using ES6 and support ESM modules.

## Install

`npm install @exceptionless/vue --save`

## Configuration

While your app is starting up, you should call `startup` on the Exceptionless
client. This ensures the client is configured and automatic capturing of
unhandled errors occurs. Below is from an example vue applications `main.js` file.

```js
import { createApp } from "vue";
import App from "./App.vue";
import { Exceptionless, ExceptionlessErrorHandler } from "@exceptionless/vue";

Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.usePersistedQueueStorage = true;
  c.setUserIdentity("12345678", "Blake");

  c.defaultTags.push("Example", "Vue");
});

const app = createApp(App);
// Set the global vue error handler.
app.config.errorHandler = ExceptionlessErrorHandler;
app.mount("#app");
```

## Handling Events

While errors within the components themselves are automatically sent to
Exceptionless, you will still want to handle events that happen outside the
components.

Because the Exceptionless client is a singleton, it is available anywhere in
 your app where you import it. Here's an example from a file we'll call `utilities.js`.

```js
export const myUtilityFunction = async () => {
  try {
    //  Handle successful run of code
  } catch(e) {
    //  If there's an error, send it to Exceptionless
    await Exceptionless.submitException(e);
  }
}
```

You can also sent events and logs that are not errors by simply calling the
built-in methods on the Exceptionless class:

```js
await Exceptionless.submitLog("Hello, world!");
await Exceptionless.submitFeatureUsage("New Shopping Cart Feature");
```

Please see the [docs](https://exceptionless.com/docs/clients/javascript/) for
more information on configuring the client.

## Support

If you need help, please contact us via in-app support,
[open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new)
or [join our chat on Discord](https://discord.gg/6HxgFCx). We’re always here to
help if you have any questions!
