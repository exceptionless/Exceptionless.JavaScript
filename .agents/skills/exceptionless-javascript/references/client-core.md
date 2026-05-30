# @exceptionless/core

Use for custom runtimes, tests, or advanced pipelines that do not need browser or Node automatic capture.

Docs: https://exceptionless.com/docs/clients/javascript/

## Install

```bash
npm install @exceptionless/core --save
```

## Configure

```js
import { ExceptionlessClient } from "@exceptionless/core";

const client = new ExceptionlessClient();

await client.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.version = "1.2.3";
  config.setUserIdentity("12345678", "Blake");
  config.defaultTags.push("Example", "JavaScript", "Core");
  config.defaultData["deployment"] = { environment: "production" };
});
```

## Send

```js
import { ExceptionlessClient } from "@exceptionless/core";

const client = new ExceptionlessClient();
await client.startup("API_KEY_HERE");
await client.submitLog("custom-runtime", "Hello world", "info");
await client.submitFeatureUsage("New Shopping Cart Feature");
```

For full event examples, read [sending-events.md](sending-events.md). For all configuration patterns, read [configuration.md](configuration.md).

## Source Anchors

- `packages/core/README.md`
- `packages/core/src/ExceptionlessClient.ts`
- `packages/core/src/configuration/Configuration.ts`
- `packages/core/src/EventBuilder.ts`
