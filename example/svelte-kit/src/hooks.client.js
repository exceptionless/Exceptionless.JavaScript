import { Exceptionless, toError } from "@exceptionless/browser";

Exceptionless.startup((c) => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
  c.serverUrl = "https://localhost:5100";
  c.useDebugLogger();

  c.defaultTags.push("Example", "svelte-kit", "client");
});

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error, event, message, status }) {
  console.warn({ error, event, message, source: "client error handler", status });
  await Exceptionless.createException(toError(error ?? message))
    .setProperty("status", status)
    .submit();
}
