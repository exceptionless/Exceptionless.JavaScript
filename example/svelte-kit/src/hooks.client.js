import { Exceptionless } from "@exceptionless/browser";

Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
});

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error, event }) {
  console.log('client error handler');
  await Exceptionless.submitException(error);
}
