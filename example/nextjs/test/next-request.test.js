import { describe, expect, test } from "vitest";

import { buildRequestContextFromOnRequestError, buildRequestContextFromRequest } from "../lib/next-request.js";

describe("next request adapter", () => {
  test("builds request info from a web request", () => {
    const request = new Request("https://demo.exceptionless.dev/api/demo?mode=log&ref=homepage", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest Browser",
        "x-forwarded-for": "203.0.113.10, 10.0.0.5"
      }
    });

    const result = buildRequestContextFromRequest(request, {
      mode: "log",
      triggeredFrom: "test"
    });

    expect(result).toEqual({
      method: "POST",
      secure: true,
      ip: "203.0.113.10",
      hostname: "demo.exceptionless.dev",
      path: "/api/demo",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest Browser",
        "x-forwarded-for": "203.0.113.10, 10.0.0.5"
      },
      params: {
        mode: "log",
        ref: "homepage"
      },
      body: {
        mode: "log",
        triggeredFrom: "test"
      }
    });
  });

  test("builds request info from the onRequestError payload", () => {
    const result = buildRequestContextFromOnRequestError({
      path: "/server-component-error?from=test",
      method: "GET",
      headers: {
        host: "localhost:3000",
        "user-agent": "Vitest Server",
        "x-forwarded-proto": "https",
        "x-real-ip": "127.0.0.1"
      }
    });

    expect(result).toEqual({
      method: "GET",
      secure: true,
      ip: "127.0.0.1",
      hostname: "localhost",
      path: "/server-component-error",
      headers: {
        host: "localhost:3000",
        "user-agent": "Vitest Server",
        "x-forwarded-proto": "https",
        "x-real-ip": "127.0.0.1"
      },
      params: {
        from: "test"
      },
      body: undefined
    });
  });
});
