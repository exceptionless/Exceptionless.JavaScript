import { Exceptionless, KnownEventDataKeys } from "../../../packages/browser/dist/index.bundle.js";

export { Exceptionless };

let startupPromise;

export function startup() {
  startupPromise ??= Exceptionless.startup((config) => {
    if (process.env.NEXT_PUBLIC_EXCEPTIONLESS_API_KEY) {
      config.apiKey = process.env.NEXT_PUBLIC_EXCEPTIONLESS_API_KEY;
    }

    if (process.env.NEXT_PUBLIC_EXCEPTIONLESS_SERVER_URL) {
      config.serverUrl = process.env.NEXT_PUBLIC_EXCEPTIONLESS_SERVER_URL;
    }

    if (process.env.NODE_ENV !== "production") {
      config.useDebugLogger();
    }

    config.addDataExclusions("authorization", "cookie", "password", "set-cookie", "token");
    config.defaultTags.push("Example", "nextjs", "client");
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
            runtime: "browser"
          }
        };

        return Promise.resolve();
      }
    });
  });

  return startupPromise;
}
