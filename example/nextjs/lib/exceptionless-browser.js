import { Exceptionless, KnownEventDataKeys } from "@exceptionless/browser";

export { Exceptionless };

const DEFAULT_API_KEY = "LhhP1C9gijpSKCslHHCvwdSIz298twx271nTest";
const DEFAULT_SERVER_URL = "https://ex.dev.localhost:7111";

let startupPromise;

export function startup() {
  startupPromise ??= Exceptionless.startup((config) => {
    config.apiKey = (process.env.NEXT_PUBLIC_EXCEPTIONLESS_API_KEY || DEFAULT_API_KEY).trim();
    config.serverUrl = (process.env.NEXT_PUBLIC_EXCEPTIONLESS_SERVER_URL || DEFAULT_SERVER_URL).trim();

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
