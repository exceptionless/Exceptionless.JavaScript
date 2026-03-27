import { Exceptionless, KnownEventDataKeys, toError } from "@exceptionless/node";

export { Exceptionless, KnownEventDataKeys, toError };

let startupPromise;

export async function startup() {
  startupPromise ??= Exceptionless.startup((config) => {
    const apiKey = (process.env.EXCEPTIONLESS_API_KEY || process.env.NEXT_PUBLIC_EXCEPTIONLESS_API_KEY || "").trim();
    if (apiKey) {
      config.apiKey = apiKey;
    }

    const serverUrl = (process.env.EXCEPTIONLESS_SERVER_URL || process.env.NEXT_PUBLIC_EXCEPTIONLESS_SERVER_URL || "").trim();
    if (serverUrl) {
      config.serverUrl = serverUrl;
    }

    if (process.env.NODE_ENV !== "production") {
      config.useDebugLogger();
    }

    config.addDataExclusions("authorization", "cookie", "password", "set-cookie", "token");
    config.defaultTags.push("Example", "nextjs", "server");
    config.addPlugin({
      priority: 90,
      name: "NextEnvironmentInfoPlugin",
      run(context) {
        const eventData = context.event.data ?? {};
        context.event.data = eventData;

        const environment =
          typeof eventData[KnownEventDataKeys.EnvironmentInfo] === "object" && eventData[KnownEventDataKeys.EnvironmentInfo] !== null
            ? eventData[KnownEventDataKeys.EnvironmentInfo]
            : {};
        const environmentData = typeof environment.data === "object" && environment.data !== null ? environment.data : {};

        eventData[KnownEventDataKeys.EnvironmentInfo] = {
          ...environment,
          data: {
            ...environmentData,
            framework: "Next.js",
            router: "App Router",
            runtime: "nodejs",
            ...((process.env.VERCEL_ENV ?? process.env.NODE_ENV) ? { deployment: process.env.VERCEL_ENV ?? process.env.NODE_ENV } : {}),
            ...(process.env.VERCEL_REGION ? { region: process.env.VERCEL_REGION } : {}),
            ...(process.env.VERCEL_URL ? { url: process.env.VERCEL_URL } : {}),
            ...(process.env.VERCEL_GIT_COMMIT_SHA ? { commit: process.env.VERCEL_GIT_COMMIT_SHA } : {})
          }
        };

        return Promise.resolve();
      }
    });
  });

  await startupPromise;

  return { Exceptionless, KnownEventDataKeys, toError };
}
