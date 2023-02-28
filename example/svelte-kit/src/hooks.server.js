import { toError } from "@exceptionless/core";
import { Exceptionless } from "@exceptionless/node";

Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
  c.useDebugLogger();

  c.defaultTags.push("Example", "svelte-kit", "server");
});

/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error, event }) {
  console.log('server error handler');
  await Exceptionless.submitException(toError(error));
}
