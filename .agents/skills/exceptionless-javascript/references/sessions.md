# Sessions, Heartbeats, And User Identity

Use for user/session correlation, session start/end events, heartbeats, and documentation that needs to explain how events are grouped into a user journey.

Docs: https://exceptionless.com/docs/user-sessions/

## Automatic Sessions

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("user-123", "Jane Doe");
  config.useSessions(true, 60000, true);
});
```

`setUserIdentity(identity, name?)` adds user identity data to future events. Treat names and emails as PII; read [data-exclusions.md](data-exclusions.md) before encouraging collection of user-identifying data.

## Heartbeats

`useSessions(sendHeartbeats, heartbeatInterval, useSessionIdManagement)` enables session tracking.

- `sendHeartbeats` controls whether heartbeat requests are sent on an interval.
- `heartbeatInterval` defaults to 60000ms. Values below 30000ms are reset to 60000ms.
- `useSessionIdManagement` adds `SessionIdManagementPlugin`, which creates a session id and links later events to it.

Disable heartbeat traffic while still using session events:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("user-123", "Jane Doe");
  config.useSessions(false, 60000, true);
});
```

## Manual Session Events

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("user-123", "Jane Doe");
  config.useSessions(false, 60000, true);
});

await Exceptionless.submitSessionStart();
await Exceptionless.submitFeatureUsage("CheckoutStarted");
await Exceptionless.submitSessionHeartbeat();
await Exceptionless.submitSessionEnd();
```

`submitSessionHeartbeat(sessionIdOrUserId?)` and `submitSessionEnd(sessionIdOrUserId?)` use the current session id when one exists. Pass an explicit id only when integrating an external session system.

## Source Anchors

- `packages/core/src/configuration/Configuration.ts`
- `packages/core/src/ExceptionlessClient.ts`
- `packages/core/src/plugins/default/HeartbeatPlugin.ts`
- `packages/core/src/plugins/default/SessionIdManagementPlugin.ts`
