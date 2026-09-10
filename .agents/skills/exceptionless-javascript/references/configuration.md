# Configuration And Client Configuration Values

Docs:

- Configuration: https://exceptionless.com/docs/clients/javascript/client-configuration/
- Client configuration values: https://exceptionless.com/docs/clients/javascript/client-configuration-values/

## Required

Only `apiKey` is required.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup("API_KEY_HERE");
```

Use the callback form when setting multiple values:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.version = "1.2.3";
  config.environment = "production";
  config.setUserIdentity("12345678", "Blake");
  config.defaultTags.push("Example", "JavaScript");
});
```

## Deployment environment

Set `config.environment = "production"` or call `config.setEnvironment("production")`. Per-event `setEnvironment("staging")` overrides the default. Names are trimmed and retain their supplied casing; empty names, names longer than 64 characters, and control characters are ignored. Missing values remain unspecified. The server filters case-insensitively and normalizes aggregation keys. This property is independent of `data.@environment` runtime metadata and of the application version. It does not change server stack grouping or create per-environment status.

## Privacy

For deeper guidance on PII removal, read [data-exclusions.md](data-exclusions.md).

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.includePrivateInformation = false;
  config.addDataExclusions("authorization", "cookie", "password", "secret", "set-cookie", "token");
});
```

Use finer flags when needed: `includeIpAddress`, `includeHeaders`, `includeCookies`, `includePostData`, and `includeQueryString`.

## Sessions

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.setUserIdentity("12345678", "Blake");
  config.useSessions(true, 60000, true);
});
```

## Client Configuration Values

Exceptionless can sync project settings to the client. Use this for runtime event filtering or feature toggles without redeploying.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.addPlugin("CancelLogsWhenDisabled", 100, (context) => {
    const enabled = context.client.config.settings["enableLogSubmission"];

    if (context.event.type === "log" && enabled === "false") {
      context.cancelled = true;
    }

    return Promise.resolve();
  });
});
```

To disable idle settings refresh:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.updateSettingsWhenIdleInterval = -1;
});
```

Source-level log settings use keys such as `@@log:*`, `@@log:app.logger`, or `@@log:app.*`.
