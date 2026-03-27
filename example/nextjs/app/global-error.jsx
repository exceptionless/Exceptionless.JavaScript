"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Exceptionless, startup } from "../lib/exceptionless-browser.js";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (!error.digest) {
      void (async () => {
        try {
          await startup();
          await Exceptionless.createException(error)
            .addTags("error-boundary")
            .setProperty("handledBy", "app/global-error.jsx")
            .submit();
        } catch (submitError) {
          console.error("Exceptionless global boundary capture failed", submitError);
        }
      })();
    }
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="error-shell">
          <section className="panel error-card">
            <div className="panel-body">
              <p className="eyebrow">Global Error Boundary</p>
              <h1>The root layout failed.</h1>
              <p>
                This is the last-resort client boundary for the App Router. In normal server-rendered failures we still prefer the richer `onRequestError` path.
              </p>
              <div className="error-actions">
                <button type="button" onClick={() => reset()}>
                  Retry the app shell
                </button>
                <Link href="/">Back to the example</Link>
              </div>
              {error.digest ? <p className="error-digest">Server digest: {error.digest}</p> : null}
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
