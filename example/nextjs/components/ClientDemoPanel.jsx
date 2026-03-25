"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { Exceptionless, startup } from "../lib/exceptionless-browser.js";

export default function ClientDemoPanel() {
  const [status, setStatus] = useState("Ready. Pick any path below to generate client or server telemetry.");
  const [pending, startTransition] = useTransition();

  async function sendClientLog() {
    setStatus("Submitting a structured client log...");

    await startup();

    await Exceptionless.createLog("nextjs.client", "Client log from the demo page", "info")
      .addTags("manual-log")
      .setProperty("currentUrl", window.location.href)
      .setProperty("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone)
      .submit();

    setStatus("Client log submitted.");
  }

  async function sendHandledClientError() {
    setStatus("Submitting a handled client error...");

    try {
      throw new Error("Handled client error from the Exceptionless Next.js demo");
    } catch (error) {
      await startup();

      await Exceptionless.createException(error)
        .addTags("handled-error")
        .setProperty("handledBy", "ClientDemoPanel.handleTryCatch")
        .setProperty("currentUrl", window.location.href)
        .submit();
    }

    setStatus("Handled client error submitted.");
  }

  function triggerUnhandledRejection() {
    setStatus("Triggered an unhandled promise rejection. The browser global handler should capture it.");
    Promise.reject(new Error("Unhandled promise rejection from the Exceptionless Next.js demo"));
  }

  function triggerBoundaryCrash() {
    setStatus("Crashing the route boundary...");

    startTransition(() => {
      throw new Error("Client transition crash from the Exceptionless Next.js demo");
    });
  }

  async function callServerRoute(mode) {
    setStatus(mode === "error" ? "Triggering a route handler crash..." : "Submitting a route handler log...");

    const response = await fetch("/api/demo", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        mode,
        triggeredFrom: "ClientDemoPanel",
        currentUrl: window.location.href,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });

    if (!response.ok) {
      setStatus(`Route handler error triggered with HTTP ${response.status}. The server onRequestError hook should capture it.`);
      return;
    }

    const payload = await response.json();
    setStatus(payload.message);
  }

  return (
    <section className="panel">
      <div className="panel-body">
        <h2>Try the integration</h2>
        <p>
          The first four buttons stay in the browser. The next two go through a real Next route handler. The link at the bottom opens a route that throws during
          server rendering.
        </p>

        <div className="button-grid">
          <button type="button" onClick={() => void sendClientLog()} disabled={pending}>
            <span className="button-label">
              <strong>Send client log</strong>
              <span>Manual log event with URL and timezone metadata.</span>
            </span>
            <span className="button-arrow">+</span>
          </button>

          <button type="button" onClick={() => void sendHandledClientError()} disabled={pending}>
            <span className="button-label">
              <strong>Send handled client error</strong>
              <span>Manual exception capture from a local try/catch block.</span>
            </span>
            <span className="button-arrow">+</span>
          </button>

          <button type="button" onClick={triggerUnhandledRejection} disabled={pending}>
            <span className="button-label">
              <strong>Trigger unhandled rejection</strong>
              <span>Exercises the browser global handler installed during startup.</span>
            </span>
            <span className="button-arrow">!</span>
          </button>

          <button type="button" onClick={triggerBoundaryCrash} disabled={pending}>
            <span className="button-label">
              <strong>Crash the route boundary</strong>
              <span>Throws inside a transition so `app/error.jsx` catches it.</span>
            </span>
            <span className="button-arrow">!</span>
          </button>

          <button type="button" onClick={() => void callServerRoute("log")} disabled={pending}>
            <span className="button-label">
              <strong>Send server route log</strong>
              <span>Hits `/api/demo` and enriches the log with request data.</span>
            </span>
            <span className="button-arrow">+</span>
          </button>

          <button type="button" onClick={() => void callServerRoute("error")} disabled={pending}>
            <span className="button-label">
              <strong>Trigger route handler error</strong>
              <span>Throws in `/api/demo` so `instrumentation.js` captures it.</span>
            </span>
            <span className="button-arrow">!</span>
          </button>

          <Link href="/server-component-error" prefetch={false}>
            <span className="button-label">
              <strong>Open the server component error route</strong>
              <span>Exercises the App Router render path and `onRequestError`.</span>
            </span>
            <span className="button-arrow">→</span>
          </Link>
        </div>

        <div className="status">
          <strong>Latest status</strong>
          <span>{status}</span>
        </div>
      </div>
    </section>
  );
}
