import { buildRequestContextFromOnRequestError } from "./lib/next-request.js";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { startup } = await import("./lib/exceptionless-server.js");
  await startup();
}

export async function onRequestError(error, request, context) {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { Exceptionless, KnownEventDataKeys, startup, toError } = await import("./lib/exceptionless-server.js");
  const digest = typeof error === "object" && error !== null && "digest" in error ? error.digest : undefined;

  await startup();

  const builder = Exceptionless.createUnhandledException(toError(error), `nextjs.${context.routeType}`).addTags("on-request-error");

  builder.setContextProperty(KnownEventDataKeys.RequestInfo, buildRequestContextFromOnRequestError(request));
  builder.setProperty("digest", digest);
  builder.setProperty("routePath", context.routePath);
  builder.setProperty("routeType", context.routeType);
  builder.setProperty("routerKind", context.routerKind);
  builder.setProperty("renderSource", context.renderSource);
  builder.setProperty("renderType", context.renderType);
  builder.setProperty("revalidateReason", context.revalidateReason);

  await builder.submit();
  await Exceptionless.processQueue();
}
