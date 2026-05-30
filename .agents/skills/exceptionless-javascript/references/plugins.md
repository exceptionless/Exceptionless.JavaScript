# Plugins

Use for custom event enrichment, event cancellation, runtime filtering, lifecycle work, or documenting how platform packages add behavior.

Related docs:

- Client configuration values: https://exceptionless.com/docs/clients/javascript/client-configuration-values/
- Project settings and event exclusions: https://exceptionless.com/docs/project-settings/

## Inline Plugin

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.addPlugin("CancelHealthChecks", 80, (context) => {
    if (context.event.type === "404" && context.event.source === "/healthz") {
      context.cancelled = true;
    }

    return Promise.resolve();
  });
});
```

## Class Plugin

```ts
import type { EventPluginContext, IEventPlugin, PluginContext } from "@exceptionless/core";
import { Exceptionless } from "@exceptionless/browser";

class DeploymentPlugin implements IEventPlugin {
  priority = 90;
  name = "DeploymentPlugin";

  startup(context: PluginContext): Promise<void> {
    context.log.info("Deployment plugin started");
    return Promise.resolve();
  }

  run(context: EventPluginContext): Promise<void> {
    context.event.data ??= {};
    context.event.data["deployment"] = "production";
    return Promise.resolve();
  }
}
await Exceptionless.startup((config) => {
  config.apiKey = "API_KEY_HERE";
  config.addPlugin(new DeploymentPlugin());
});
```

## Rules

- Lower `priority` values run earlier.
- Setting `context.cancelled = true` stops later plugins and prevents submission.
- Plugin errors are caught by `EventPluginManager`; the event is cancelled to avoid sending partially processed data.
- Keep plugins small. Prefer plugins for cross-cutting enrichment or filtering, not business logic.
- Be careful adding user, request, headers, cookies, query, or body data. Read [data-exclusions.md](data-exclusions.md) first.

## Source Anchors

- `packages/core/src/plugins/IEventPlugin.ts`
- `packages/core/src/plugins/EventPluginManager.ts`
- `packages/core/src/plugins/EventPluginContext.ts`
- `packages/core/src/configuration/Configuration.ts`
- `packages/core/test/plugins/EventPluginManager.test.ts`
- `packages/core/test/DocumentationExamples.test.ts`
