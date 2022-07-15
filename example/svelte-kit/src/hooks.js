import { Exceptionless } from "@exceptionless/browser";

Exceptionless.startup(c => {
  c.apiKey = "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw";
  c.serverUrl = "http://localhost:5000";
});

/** @type {import('@sveltejs/kit').HandleError} */
export async function handleError({ error, request }) {
  await Exceptionless.submitException(error);
}