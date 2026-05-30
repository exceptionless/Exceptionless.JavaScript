---
name: exceptionless-javascript
description: Use this skill when a developer wants to install, configure, troubleshoot, or integrate Exceptionless JavaScript clients for browser, Node.js, React, React Native, Expo, Vue, AngularJS, Express, Next.js, SvelteKit, or custom runtimes. Use it for API keys, startup, self-hosting, sending errors/logs/feature usage/404/custom events, indexed event properties, sessions, heartbeats, user identity, PII/data exclusions, plugins, runtime client configuration values, queues, native crash reporting, and production setup even if they only ask "how do I wire up Exceptionless?"
---

# Exceptionless JavaScript SDK

Use this skill to produce source-accurate setup code, integration guidance, and technical documentation for the Exceptionless JavaScript clients.

Keep answers compact. Prefer pointing to official docs for broad product behavior, and use local package READMEs/source to correct stale snippets or repo-specific package details.

## Official Docs

Primary docs:

- JavaScript overview: https://exceptionless.com/docs/clients/javascript/
- Configuration: https://exceptionless.com/docs/clients/javascript/client-configuration/
- Client configuration values: https://exceptionless.com/docs/clients/javascript/client-configuration-values/
- Sending events: https://exceptionless.com/docs/clients/javascript/sending-events/
- Filtering and indexed data: https://exceptionless.com/docs/filtering-and-searching/
- User sessions: https://exceptionless.com/docs/user-sessions/
- Troubleshooting: https://exceptionless.com/docs/clients/javascript/troubleshooting/
- Self-hosting: https://exceptionless.com/docs/self-hosting/

Framework docs:

- React: https://exceptionless.com/docs/clients/javascript/guides/react/
- Vue: https://exceptionless.com/docs/clients/javascript/guides/vue/
- Angular: https://exceptionless.com/docs/clients/javascript/guides/angular/
- Node: https://exceptionless.com/docs/clients/javascript/node-example/
- Express: https://exceptionless.com/docs/clients/javascript/guides/express/

## Pick References

Read only the reference that matches the user's runtime, then add shared references as needed:

- `@exceptionless/core`: [references/client-core.md](references/client-core.md)
- `@exceptionless/browser`: [references/client-browser.md](references/client-browser.md)
- `@exceptionless/node`: [references/client-node.md](references/client-node.md)
- `@exceptionless/react`: [references/client-react.md](references/client-react.md)
- `@exceptionless/react-native`: [references/client-react-native.md](references/client-react-native.md)
- `@exceptionless/vue`: [references/client-vue.md](references/client-vue.md)
- `@exceptionless/angularjs`: [references/client-angularjs.md](references/client-angularjs.md)
- Sending events: [references/sending-events.md](references/sending-events.md)
- Configuration and client configuration values: [references/configuration.md](references/configuration.md)
- Sessions, heartbeats, and user identity: [references/sessions.md](references/sessions.md)
- Plugins: [references/plugins.md](references/plugins.md)
- Data exclusions and PII: [references/data-exclusions.md](references/data-exclusions.md)
- Troubleshooting: [references/troubleshooting.md](references/troubleshooting.md)
- Self-hosting: [references/self-hosting.md](references/self-hosting.md)

## Rules

- Use `Exceptionless.startup(...)` once during app startup. `startup()` with no args is used later by lifecycle plugins to resume timers/queue processing.
- Use the singleton from the platform package when automatic capture matters. Create `ExceptionlessClient` manually only for custom pipelines or tests.
- For React Native or Expo apps, use `@exceptionless/react-native`; do not substitute `@exceptionless/browser` or `@exceptionless/react`.
- In Expo, add `@exceptionless/react-native/expo-plugin` when native iOS crash reporting is expected. Expo Go can report JavaScript errors but cannot load the native crash reporter.
- `submitException` and `createException` take an `Error`. For unknown caught values, use exported `toError(value)` when available.
- `markAsCritical()` marks the event critical; `markAsCritical(false)` leaves tags unchanged.
- `config.serverUrl` also sets `configServerUrl` and `heartbeatServerUrl`; assign custom endpoint overrides after setting `serverUrl`.
- Use lowercase log levels in new snippets: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`, `"off"`.
- For short-lived Node/serverless work, call `await Exceptionless.processQueue()` after critical submissions.

## Integrator Guidance

- Prefer complete, copyable snippets with imports and realistic placeholder values.
- Include only high-level setup/configuration inline; point to official docs for broader product explanation.
- Make privacy controls explicit in production examples that collect request, cookie, header, query, post, or user data. Read [references/data-exclusions.md](references/data-exclusions.md) for PII-sensitive examples.
- Read [references/plugins.md](references/plugins.md) before documenting custom event enrichment, runtime filtering, or cancellation behavior.
- Read [references/sessions.md](references/sessions.md) before documenting sessions, heartbeats, user identity, or session end behavior.
- Explain near real-time client settings with server setting keys only for advanced docs: `@@log:*`, `@@error:*`, `@@usage:*`, `@@404:*`, `@@DataExclusions`, `@@UserAgentBotPatterns`.
- For SSR, hot reload, or serverless examples, memoize startup and flush short-lived server work with `await Exceptionless.processQueue()`.
- Before calling snippets "compiled" or "validated", actually type-check or run a representative compile against the workspace packages.

## Source Anchors

Verify behavior in:

- `packages/core/src/ExceptionlessClient.ts`
- `packages/core/src/configuration/Configuration.ts`
- `packages/core/src/EventBuilder.ts`
- `packages/core/src/plugins/default/EventExclusionPlugin.ts`
- `packages/core/src/submission/DefaultSubmissionClient.ts`
- `packages/browser/src/BrowserExceptionlessClient.ts`
- `packages/node/src/NodeExceptionlessClient.ts`
- `packages/react-native/src/ReactNativeExceptionlessClient.ts`
- `packages/react-native/src/plugins/ReactNativeErrorPlugin.ts`
- `packages/react-native/src/plugins/NativeCrashPlugin.ts`
- Package READMEs and `example/` apps.
