import { describe, expect, test } from "vitest";

import { EventContext, EventPluginContext, ExceptionlessClient, KnownEventDataKeys, RequestInfo } from "@exceptionless/core";

import { NodeRequestInfoPlugin } from "../../src/plugins/NodeRequestInfoPlugin.js";

describe("NodeRequestInfoPlugin", () => {
  const run = async (request: Record<string, unknown>): Promise<RequestInfo | undefined> => {
    const client = new ExceptionlessClient();
    const eventContext = new EventContext();
    eventContext[KnownEventDataKeys.RequestInfo] = request;

    const context = new EventPluginContext(
      client,
      {
        data: {}
      },
      eventContext
    );
    await new NodeRequestInfoPlugin().run(context);
    return context.event.data?.[KnownEventDataKeys.RequestInfo];
  };

  test("should set query_string from the request query instead of route params", async () => {
    const requestInfo = await run({
      method: "GET",
      secure: false,
      ip: "127.0.0.1",
      hostname: "localhost",
      path: "/users/42",
      headers: {
        host: "localhost:3000",
        "user-agent": "test"
      },
      params: {
        id: "42"
      },
      query: {
        search: "abc",
        page: "2"
      }
    });

    expect(requestInfo?.path).toBe("/users/42");
    expect(requestInfo?.query_string).toEqual({
      search: "abc",
      page: "2"
    });
  });

  test("should omit query_string when the request has no query", async () => {
    const requestInfo = await run({
      method: "GET",
      path: "/users/42",
      headers: {
        "user-agent": "test"
      },
      params: {
        id: "42"
      }
    });

    expect(requestInfo?.query_string).toBeUndefined();
  });
});
