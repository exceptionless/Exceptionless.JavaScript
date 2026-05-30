# Data Exclusions And PII

Use for production configuration, security review, privacy-sensitive examples, request capture, custom properties, and docs that mention headers, cookies, query strings, form/post data, IP addresses, user identity, or user descriptions.

Docs:

- JavaScript privacy configuration: https://exceptionless.com/docs/clients/javascript/client-configuration/
- Security and data exclusions: https://exceptionless.com/docs/security/
- Project settings data exclusions: https://exceptionless.com/docs/project-settings/

## Why This Matters

Exceptionless events can include rich diagnostic context. That context can accidentally contain PII, credentials, secrets, session tokens, cookies, authorization headers, request bodies, query strings, user names, email addresses, IP addresses, or payment data. Production examples must make privacy choices explicit.

Prefer removing sensitive data at the client before it leaves the process. Do not rely on people noticing sensitive fields later in the dashboard.

## Safe Production Baseline

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.includePrivateInformation = false;
  config.addDataExclusions(
    "authorization",
    "cookie",
    "password",
    "secret",
    "set-cookie",
    "token",
    "*password*",
    "*secret*",
    "*token*"
  );
});
```

`includePrivateInformation = false` disables IP address, headers, cookies, post data, and query string collection in the current JavaScript client.

## Finer-Grained Controls

Use this when the app needs some request metadata but not everything:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.addDataExclusions("authorization", "cookie", "password", "secret", "set-cookie", "token");
  config.includeIpAddress = false;
  config.includeHeaders = false;
  config.includeCookies = false;
  config.includePostData = false;
  config.includeQueryString = false;
});
```

## Per-Event Exclusions

Exclude sensitive fields when adding custom objects:

```js
import { Exceptionless } from "@exceptionless/browser";

const error = new Error("Unable to create order");
const order = {
  id: "order-123",
  quoteId: 123,
  creditCardNumber: "4111111111111111",
  securityCode: "123"
};

await Exceptionless.createException(error)
  .setProperty("Order", order, 4, ["creditCardNumber", "securityCode"])
  .submit();
```

## Runtime Data Exclusions

Project settings can send `@@DataExclusions` to the client. The JavaScript configuration combines server-provided exclusions with local `addDataExclusions(...)` values.

## Where Exclusions Apply

Source-verified areas include:

- `EventBuilder.setProperty(...)` custom event data.
- Default data via `ConfigurationDefaultsPlugin`.
- Browser and Node request cookies, headers, query string, and post data when those collection flags are enabled.
- Browser and Node error properties.

## Review Checklist

- Never include raw authorization headers, cookies, access tokens, refresh tokens, API keys, passwords, or payment fields in examples.
- Treat query strings and request bodies as sensitive by default.
- Do not add user email or full name unless the example explicitly needs identity correlation.
- If enabling headers/cookies/body/query capture, pair it with `addDataExclusions(...)`.
- For self-hosted examples, privacy still matters; self-hosted does not make PII safe to collect.

## Source Anchors

- `packages/core/src/configuration/Configuration.ts`
- `packages/core/src/EventBuilder.ts`
- `packages/core/src/plugins/default/ConfigurationDefaultsPlugin.ts`
- `packages/browser/src/plugins/BrowserRequestInfoPlugin.ts`
- `packages/browser/src/plugins/BrowserErrorPlugin.ts`
- `packages/node/src/plugins/NodeRequestInfoPlugin.ts`
- `packages/node/src/plugins/NodeErrorPlugin.ts`
