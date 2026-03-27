import { Exceptionless, startup } from "./lib/exceptionless-browser.js";

void startup().catch((error) => {
  console.error("Exceptionless browser startup failed", error);
});

export function onRouterTransitionStart(url, navigationType) {
  void recordRouterTransitionStart(url, navigationType);
}

async function recordRouterTransitionStart(url, navigationType) {
  try {
    await startup();

    await Exceptionless.createLog("nextjs.navigation", "Route transition started", "info")
      .addTags("navigation")
      .setProperty("navigationType", navigationType)
      .setProperty("url", url)
      .submit();
  } catch (error) {
    console.error("Exceptionless navigation tracking failed", error);
  }
}
