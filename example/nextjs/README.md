## Exceptionless for Next.js

This example is a very small App Router site that shows the Exceptionless integration shape we want for a Next.js app: simple setup, rich metadata, and clear client/server error coverage.

- `instrumentation-client.js` for browser startup and navigation logging
- `instrumentation.js` for server startup and `onRequestError`
- `app/error.jsx` for route-level client render failures
- `app/global-error.jsx` for root-level client render failures
- `app/api/demo/route.js` for explicit server-side logging from a route handler

### What it covers

- Manual client logs with structured data
- Handled client exceptions submitted from a `try`/`catch`
- Unhandled client promise rejections captured by the browser global handler
- A client transition crash that lands in `app/error.jsx`
- A server route log enriched with request headers, IP, path, query string, and JSON body
- An unhandled route handler error captured by `onRequestError`
- A server component render error captured by `onRequestError`

### Why it is shaped this way

This sticks to the native Next.js file boundaries instead of inventing another framework layer:

- `instrumentation-client.js` is where client-side monitoring starts before the app becomes interactive.
- `instrumentation.js` and `onRequestError` are where uncaught server render, route handler, server action, and proxy errors are captured.
- `app/error.jsx` and `app/global-error.jsx` stay responsible for client render failures inside the App Router.
- Route handlers submit logs directly with `Exceptionless.createLog(...)`, the environment module memoizes `Exceptionless.startup(...)`, and the server flushes with `Exceptionless.processQueue()` when needed.

### Vercel-specific notes

- The server helper flushes the Exceptionless queue explicitly. That matters for short-lived serverless runtimes where a background timer may not get enough time to send queued events.
- The route handler uses `after()` so normal server logs flush after the response is sent.
- The example locally aliases `source-map` to `false` in `next.config.mjs` so an unused `stacktrace-gps` AMD branch does not leak a `source-map` dependency into `@exceptionless/browser`.
- The helper files import the built ESM bundles from `packages/browser/dist/index.bundle.js` and `packages/node/dist/index.bundle.js` because the package entrypoints still re-export internal `#/*` imports. The example also uses `--webpack` because Turbopack currently rejects the node bundle during page data collection on `node-localstorage`'s dynamic `require`.
- If we later package this for production ergonomics, the clean split is likely a very thin `@exceptionless/nextjs` helper for framework hooks plus an optional `@exceptionless/vercel` add-on for `@vercel/otel`, deployment metadata, and queue-flush helpers.

### Environment variables

Set the env vars you want the example to use:

- `NEXT_PUBLIC_EXCEPTIONLESS_API_KEY`
- `NEXT_PUBLIC_EXCEPTIONLESS_SERVER_URL`
- `EXCEPTIONLESS_API_KEY`
- `EXCEPTIONLESS_SERVER_URL`

### Run locally

1. `npm install`
2. `npm run build`
3. `cd example/nextjs`
4. `npm run dev`
