"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Exceptionless, startup } from "../lib/exceptionless-browser.js";

export default function ErrorPage({ error, reset }) {
  useEffect(() => {
    if (!error.digest) {
      void (async () => {
        try {
          await startup();
          await Exceptionless.createException(error).addTags("error-boundary").setProperty("handledBy", "app/error.jsx").submit();
        } catch (submitError) {
          console.error("Exceptionless route boundary capture failed", submitError);
        }
      })();
    }
  }, [error]);

  return (
    <main className="error-shell">
      <section className="panel error-card">
        <div className="panel-body">
          <p className="eyebrow">Route Error Boundary</p>
          <h1>Something inside this route broke.</h1>
          <p>
            Client-only render errors are submitted here. Server-rendered failures already have a digest and are captured by `instrumentation.js` through
            `onRequestError`.
          </p>
          <div className="error-actions">
            <button type="button" onClick={() => reset()}>
              Retry this route
            </button>
            <Link href="/">Back to the example</Link>
          </div>
          {error.digest ? <p className="error-digest">Server digest: {error.digest}</p> : null}
        </div>
      </section>
    </main>
  );
}
