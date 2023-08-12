import { Exceptionless, toError } from "@exceptionless/node";

Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
  c.serverUrl = "https://localhost:5100";
  c.useDebugLogger();

  c.defaultTags.push("Example", "svelte-kit", "server");
});

/** @type {import("@sveltejs/kit").HandleServerError} */
export async function handleError({ error, event }) {
  console.log("server error handler");
  await Exceptionless.submitException(toError(error));
}
