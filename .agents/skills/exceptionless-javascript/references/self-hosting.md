# Self-Hosting

Docs:

- Self-hosting overview: https://exceptionless.com/docs/self-hosting/
- JavaScript configuration: https://exceptionless.com/docs/clients/javascript/client-configuration/

Keep self-hosting guidance minimal and point to the official docs for server setup.

## Client Setup

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.serverUrl = "https://exceptionless.example.com";
});
```

`serverUrl` also updates the configuration and heartbeat endpoints. If a deployment splits endpoints, assign overrides after `serverUrl`:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.serverUrl = "https://collector.example.com";
  config.configServerUrl = "https://config.example.com";
  config.heartbeatServerUrl = "https://heartbeat.example.com";
});
```

For local physical-device testing, use a LAN-reachable host rather than `localhost`.
