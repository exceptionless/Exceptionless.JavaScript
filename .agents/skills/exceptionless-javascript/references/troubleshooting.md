# Troubleshooting

Docs: https://exceptionless.com/docs/clients/javascript/troubleshooting/

## First Checks

- Confirm the package is current enough for the code being written.
- Confirm `Exceptionless.startup(...)` ran before the event submission.
- Confirm the API key is present and valid for the target project.
- Enable SDK diagnostics while debugging.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.useDebugLogger();
});
```

## Queue Timing

Events are queued and sent in the background. If the app exits or navigates immediately after submitting an event, flush the queue.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.processQueue();
```

This matters most for Node scripts, CLIs, serverless handlers, route handlers, tests, and hard redirects.

## Privacy Filters

If expected data is absent from an event, check `includePrivateInformation`, `includeHeaders`, `includeCookies`, `includePostData`, `includeQueryString`, and `dataExclusions`.

## Runtime Settings

If expected events are missing, check synced settings and client-side filters such as `@@log:*`, `@@error:*`, `@@usage:*`, and custom plugins that set `context.cancelled = true`.

## Source Anchors

- `packages/core/src/queue/DefaultEventQueue.ts`
- `packages/core/src/plugins/default/EventExclusionPlugin.ts`
- `packages/core/src/submission/DefaultSubmissionClient.ts`
