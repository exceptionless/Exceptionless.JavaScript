import ClientDemoPanel from "../components/ClientDemoPanel.jsx";

export default function HomePage() {
  const deploymentTarget = process.env.VERCEL_ENV ?? "local";

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Exceptionless for Next.js</p>
        <h1>Client and server monitoring for Next.js.</h1>
        <p>
          This reference app keeps the setup small, but still captures the important Exceptionless signals across browser and
          server paths: logs, handled errors, unhandled errors, request metadata, and App Router error boundaries.
        </p>
        <div className="hero-meta">
          <span>Deployment target: {deploymentTarget}</span>
          <span>App Router reference integration</span>
        </div>
      </section>

      <section className="demo-grid">
        <ClientDemoPanel />

        <aside className="panel">
          <div className="panel-body">
            <h2>What the integration covers</h2>
            <p>
              The client path uses browser startup plus route boundaries. The server path uses `onRequestError`, explicit queue
              flushes, and a small request adapter so Exceptionless can attach rich request metadata to the same event builders we
              already use elsewhere.
            </p>
            <ul className="note-list">
              <li>`instrumentation-client.js` starts Exceptionless before the app becomes interactive and logs route transitions.</li>
              <li>`app/error.jsx` captures client-side render failures, but skips digest-backed server render errors to avoid duplicates.</li>
              <li>`instrumentation.js` registers the node client once per server instance and captures uncaught render and route errors.</li>
              <li>`app/api/demo/route.js` shows explicit server logging with request metadata plus `after()` for a Vercel-friendly flush.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
