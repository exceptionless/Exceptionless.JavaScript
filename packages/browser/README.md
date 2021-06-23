# Exceptionless Browser

This package provides native JavaScript support for applications that are built
in vanilla HTML and JS.

## Getting Started

To use this package, your must be using ES6 and support ESM modules.

## Installation

You can install Exceptionless either in your browser application using a `script`
tag, or you can use the Node Package Manager (npm) to install the package.

### CDN

  Add the following script tag at the very beginning of your page:

  ```html
<script type="module">
import { Exceptionless } from "https://unpkg.com/@exceptionless/browser";

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.usePersistedQueueStorage = true;
});
</script>
  ```

### npm

  1. Install the package by running `npm install @exceptionless/browser --save`.
  2. Import Exceptionless and call startup during app startup.

  ```js
  import { Exceptionless } from "@exceptionless/browser";

  await Exceptionless.startup((c) => {
    c.apiKey = "API_KEY_HERE";
    c.usePersistedQueueStorage = true;
  });
  ```

## Configuration

While your app is starting up, you should call `startup` on the Exceptionless
client. This ensures the client is configured and automatic capturing of
unhandled errors occurs.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup(c => {
  c.apiKey = "API_KEY_HERE";
  c.usePersistedQueueStorage = true;
  c.setUserIdentity("12345678", "Blake");
  c.useSessions();

  // set some default data
  c.defaultData["mydata"] = {
    myGreeting: "Hello World"
  };

  c.defaultTags.push("Example", "JavaScript", "Browser");
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
