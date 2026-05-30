# @exceptionless/vue

Use for Vue browser apps. This package re-exports the browser client and adds `ExceptionlessErrorHandler`.

Docs: https://exceptionless.com/docs/clients/javascript/guides/vue/

## Install

```bash
npm install @exceptionless/vue --save
```

## Configure

```js
import { createApp } from "vue";
import App from "./App.vue";
import { Exceptionless, ExceptionlessErrorHandler } from "@exceptionless/vue";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("12345678", "Blake");
  config.defaultTags.push("Example", "Vue");
});

const app = createApp(App);
app.config.errorHandler = ExceptionlessErrorHandler;
app.mount("#app");
```

## Send

```js
import { Exceptionless, toError } from "@exceptionless/vue";

await Exceptionless.startup("API_KEY_HERE");

try {
  throw new Error("Profile save failed");
} catch (error) {
  await Exceptionless.submitException(toError(error));
}

await Exceptionless.submitLog("vue", "Hello world", "info");
await Exceptionless.submitFeatureUsage("New Shopping Cart Feature");
```

Manually submit errors from stores, router guards, event handlers, and async utilities that catch errors.

## Source Anchors

- `packages/vue/README.md`
- `packages/vue/src/index.ts`
- `example/vue/src/main.js`
