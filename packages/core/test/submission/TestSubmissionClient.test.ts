import { Configuration } from "../../src/configuration/Configuration.js";
import { ServerSettings } from "../../src/configuration/SettingsManager.js";
import { Event } from "../../src/models/Event.js";
import { UserDescription } from "../../src/models/data/UserDescription.js";
import { Response } from "../../src/submission/Response.js";
import { TestSubmissionClient } from "./TestSubmissionClient.js"

describe("TestSubmissionClient", () => {
  const config: Configuration = new Configuration();
  config.apiKey = "UNIT_TEST_API_KEY";
  config.serverUrl = "http://server.localhost:5000";
  config.configServerUrl = "http://config.localhost:5000";
  config.heartbeatServerUrl = "http://heartbeat.localhost:5000";

  test("should submit events", async () => {
    const fetchMock = TestSubmissionClient.prototype.apiFetch = jest.fn()
      .mockReturnValueOnce(new Response(202, "", NaN, NaN, undefined));

    const events = [{ type: "log", message: "From js client", reference_id: "123454321" }];
    const client = new TestSubmissionClient(config);
    await client.submitEvents(events);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.serverUrl}/api/v2/events`);
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "POST",
      body: JSON.stringify(events)
    });
  });

  test("should submit invalid object data", async () => {
    const fetchMock = TestSubmissionClient.prototype.apiFetch = jest.fn()
      .mockReturnValueOnce(new Response(202, "", NaN, NaN, undefined));

    const events: Event[] = [{
      type: "log", message: "From js client", reference_id: "123454321", data: {
        name: "blake",
        age: () => { throw new Error("Test"); }
      }
    }];

    const client = new TestSubmissionClient(config);
    await client.submitEvents(events);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.serverUrl}/api/v2/events`);
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "POST",
      body: JSON.stringify(events)
    });
  });

  test("should submit user description", async () => {
    const fetchMock = TestSubmissionClient.prototype.apiFetch = jest.fn()
      .mockReturnValueOnce(new Response(202, "", NaN, 1, undefined))
      .mockReturnValueOnce(new Response(202, "", NaN, NaN, JSON.stringify(new ServerSettings({}, 1))));

    const description: UserDescription = {
      email_address: "norply@exceptionless.io",
      description: "unit test"
    };

    const client = config.services.submissionClient = new TestSubmissionClient(config);
    await client.submitUserDescription("123454321", description);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.serverUrl}/api/v2/events/by-ref/123454321/user-description`);
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "POST",
      body: JSON.stringify(description)
    });
    expect(fetchMock.mock.calls[1][0]).toBe(`${config.serverUrl}/api/v2/projects/config?v=0`);
    expect(fetchMock.mock.calls[1][1]).toEqual({ method: "GET" });
  });

  test("should submit heartbeat", async () => {
    const fetchMock = TestSubmissionClient.prototype.apiFetch = jest.fn()
      .mockReturnValueOnce(new Response(200, "", NaN, NaN, undefined));

    const client = new TestSubmissionClient(config);
    await client.submitHeartbeat("sessionId", true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.heartbeatServerUrl}/api/v2/events/session/heartbeat?id=sessionId&close=true`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: "GET" });
  });

  test("should get project settings", async () => {
    const fetchMock = TestSubmissionClient.prototype.apiFetch = jest.fn()
      .mockReturnValueOnce(new Response(200, "", NaN, NaN, JSON.stringify(new ServerSettings({}, 1))));

    const client = new TestSubmissionClient(config);
    await client.getSettings(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`${config.serverUrl}/api/v2/projects/config?v=0`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: "GET" });
  });
});
