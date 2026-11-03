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

Set `config.environment = "production"` or call `config.setEnvironment("production")`. Per-event `setEnvironment("staging")` overrides the default. Names are trimmed and retain their supplied casing, then must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (ASCII letters, digits, `.`, `_` and `-`, starting with a letter or digit, at most 64 characters). Anything else, such as `Staging West`, `prod/eu`, `produção`, empty or over-long names, is unspecified and never rewritten. An invalid per-event name stays unspecified instead of using the default; pass `null` or `undefined` to `setEnvironment` to use the default. Missing values remain unspecified. The server filters case-insensitively and normalizes aggregation keys. This property is independent of `data.@environment` runtime metadata and of the application version. It does not change server stack grouping or create per-environment status.

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
