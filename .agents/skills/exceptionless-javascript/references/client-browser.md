# @exceptionless/browser

Use for vanilla browser apps, script-tag usage, Vite/browser bundles, and framework integrations that import the browser client directly.

Docs: https://exceptionless.com/docs/clients/javascript/

## Install

```bash
npm install @exceptionless/browser --save
```

CDN:

```html
<script type="module">
  import { Exceptionless } from "https://unpkg.com/@exceptionless/browser";

  await Exceptionless.startup("API_KEY_HERE");
</script>
```

## Configure

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.version = "1.2.3";
  config.setUserIdentity("12345678", "Blake");
  config.useSessions();
  config.defaultTags.push("Example", "JavaScript", "Browser");
});
```

## Send

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup("API_KEY_HERE");
await Exceptionless.submitLog("browser", "Hello world", "info");
await Exceptionless.submitFeatureUsage("New Shopping Cart Feature");
```

The browser package wires global browser error/rejection capture on first startup. For privacy and self-hosted options, read [configuration.md](configuration.md) and [self-hosting.md](self-hosting.md).

## Source Anchors

- `packages/browser/README.md`
- `packages/browser/src/BrowserExceptionlessClient.ts`
- `packages/browser/src/plugins/BrowserGlobalHandlerPlugin.ts`
