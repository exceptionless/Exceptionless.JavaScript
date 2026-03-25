import { after } from "next/server";

import { Exceptionless, KnownEventDataKeys, startup } from "../../../lib/exceptionless-server.js";
import { buildRequestContextFromRequest } from "../../../lib/next-request.js";

export async function POST(request) {
  const parsedBody = await request.json().catch(() => ({}));
  const body = typeof parsedBody === "object" && parsedBody !== null ? parsedBody : { value: parsedBody };
  const mode = typeof body.mode === "string" ? body.mode : "log";

  if (mode === "error") {
    throw new Error("Route handler crash from the Exceptionless Next.js demo");
  }

  await startup();

  const builder = Exceptionless.createLog("nextjs.route", "Route handler log from the demo page", "info").addTags("route-handler");

  builder.setContextProperty(KnownEventDataKeys.RequestInfo, buildRequestContextFromRequest(request, body));

  await builder.submit();

  after(async () => {
    await Exceptionless.processQueue();
  });

  return Response.json({
    ok: true,
    message: "Server route log submitted. The queue will flush in next/after()."
  });
}
