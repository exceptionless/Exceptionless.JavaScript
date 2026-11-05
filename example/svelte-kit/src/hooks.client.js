import { Exceptionless, toError } from "@exceptionless/browser";

Exceptionless.startup((c) => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
  c.serverUrl = "https://ex.dev.localhost:7111";
  c.useDebugLogger();

  c.defaultTags.push("Example", "svelte-kit", "client");
});

/** @type {import('@sveltejs/kit/hooks').HandleClientError} */
export const handleError = async ({ error, event, kind }) => {
  console.warn({ error, event, kind, source: "client error handler" });
  const builder = Exceptionless.createException(toError(error));
  if (kind !== "unknown" && error.status != null) {
    builder.setProperty("status", error.status);
  }
  await builder.submit();
};
