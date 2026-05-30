# Sending Events

Docs:

- Sending events: https://exceptionless.com/docs/clients/javascript/sending-events/
- Filtering and indexed data: https://exceptionless.com/docs/filtering-and-searching/

Use the platform package's `Exceptionless` singleton unless the user is building a custom core client.

## Common Events

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.submitLog("Logging made easy");
await Exceptionless.submitLog("app.logger", "This is so easy", "info");
await Exceptionless.createLog("app.logger", "This is so easy", "info").addTags("Exceptionless").submit();

await Exceptionless.submitFeatureUsage("MyFeature");
await Exceptionless.createFeatureUsage("MyFeature").addTags("Exceptionless").submit();

await Exceptionless.submitNotFound("/somepage");
await Exceptionless.createNotFound("/somepage").addTags("Exceptionless").submit();

await Exceptionless.submitEvent({ message: "Low Fuel", type: "racecar", source: "Fuel System" });
```

## Exceptions

```js
import { Exceptionless, toError } from "@exceptionless/browser";

try {
  throw new Error("test");
} catch (error) {
  await Exceptionless.submitException(toError(error));
}
```

## Enriched Error

```js
import { Exceptionless } from "@exceptionless/browser";

const error = new Error("Unable to create order");
const order = {
  id: "order-123",
  quoteId: 123,
  creditCardNumber: "4111111111111111"
};

await Exceptionless.createException(error)
  .setReferenceId("order-12345678")
  .setProperty("Order", order, 4, ["creditCardNumber"])
  .setProperty("Quote", 123)
  .addTags("Order")
  .markAsCritical()
  .setGeo(43.595089, -88.444602)
  .setUserIdentity("12345678", "Blake")
  .submit();
```

## Indexed Properties

Simple extended-data values are indexed and searchable. Prefer simple `string`, `boolean`, `number`, and date-like values for fields you expect users to filter on. Keep rich objects for diagnostic detail.

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.startup("API_KEY_HERE");

await Exceptionless.createFeatureUsage("Checkout")
  .setProperty("plan", "enterprise")
  .setProperty("retryCount", 2)
  .setProperty("isTrial", false)
  .setProperty("checkoutTotal", 129.99)
  .submit();
```

These can be searched with `data.plan:enterprise`, `data.retrycount:2`, or numeric ranges. Keep custom property names short, alphanumeric, and stable because indexed field names are lowercased and invalid or very long names are ignored by the search index.

New snippets should use lowercase log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `off`.
