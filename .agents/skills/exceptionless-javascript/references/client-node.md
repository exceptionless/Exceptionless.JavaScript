# @exceptionless/node

Use for Node.js scripts, CLIs, workers, Express, Next.js server runtime, SvelteKit server hooks, and serverless functions.

Docs:

- Node: https://exceptionless.com/docs/clients/javascript/node-example/
- Express: https://exceptionless.com/docs/clients/javascript/guides/express/

## Install

```bash
npm install @exceptionless/node --save
```

## Configure

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.startup((config) => {
  config.apiKey = process.env.EXCEPTIONLESS_API_KEY ?? "API_KEY_HERE";
  config.version = process.env.npm_package_version ?? "0.0.0";
  config.defaultTags.push("Example", "JavaScript", "Node");
});
```

## Send

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.startup("API_KEY_HERE");
await Exceptionless.submitLog("node", "Hello world", "info");
await Exceptionless.submitFeatureUsage("WorkerStarted");
```

## Express Sketch

```js
import { Exceptionless, KnownEventDataKeys, toError } from "@exceptionless/node";
import express from "express";

await Exceptionless.startup("API_KEY_HERE");

const app = express();

app.use(async (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  await Exceptionless.createUnhandledException(toError(error), "express")
    .setContextProperty(KnownEventDataKeys.RequestInfo, req)
    .submit();

  res.status(500).send("Something broke");
});
```

For short-lived scripts, route handlers, and serverless work, flush after critical submissions:

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.processQueue();
```

## Source Anchors

- `packages/node/README.md`
- `packages/node/src/NodeExceptionlessClient.ts`
- `packages/node/src/plugins/NodeGlobalHandlerPlugin.ts`
- `packages/node/src/plugins/NodeRequestInfoPlugin.ts`
- `example/express/app.js`
- `example/nextjs/README.md`
