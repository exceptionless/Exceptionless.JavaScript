import { describe, test } from "@jest/globals";
import { expect } from "expect";

import { Configuration } from "../../src/configuration/Configuration.js";
import { Event } from "../../src/models/Event.js";
import { DefaultEventQueue } from "../../src/queue/DefaultEventQueue.js";
import { delay } from "../helpers.js";

describe("DefaultEventQueue", () => {
  let config: Configuration;

  beforeEach(async () => {
    config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";
    config.serverUrl = "http://server.localhost:5000";
    config.usePersistedQueueStorage = true;

    expect(await config.services.storage.length()).toBe(0);
  });

  afterEach(() => {
    const queue: any = config.services.queue;
    clearInterval(queue._queueTimer);
  });

  test("should enqueue event", async () => {
    const event: Event = { type: "log", reference_id: "123454321" };
    await config.services.queue.enqueue(event);
    expect(await config.services.storage.length()).toBe(1);
  });

  test("should process queue", async () => {
    const event: Event = { type: "log", reference_id: "123454321" };
    await config.services.queue.enqueue(event);
    expect(await config.services.storage.length()).toBe(1);
    await config.services.queue.process();

    config.services.queue.onEventsPosted(async () => {
      expect((config.services.queue as any)._suspendProcessingUntil).toBeUndefined();
      expect(await config.services.storage.length()).toBe(0);
    });
  });

  test("should discard event submission", async () => {
    await config.services.queue.suspendProcessing(1, true);

    const event: Event = { type: "log", reference_id: "123454321" };
    await config.services.queue.enqueue(event);
    expect(await config.services.storage.length()).toBe(0);
  });

  test("should suspend processing", async () => {
    await config.services.queue.suspendProcessing(.0001);

    const event: Event = { type: "log", reference_id: "123454321" };
    await config.services.queue.enqueue(event);
    expect(await config.services.storage.length()).toBe(1);

    await delay(25);
    if (!(config.services.queue as any)._suspendProcessingUntil) {
      expect(await config.services.storage.length()).toBe(0);
    } else {
      expect(await config.services.storage.length()).toBe(1);
    }
  });

  test("should respect max items", async () => {
    config.services.queue = new DefaultEventQueue(config, 1);
    const event: Event = { type: "log", reference_id: "123454321" };
    for (let index = 0; index < 2; index++) {
      await config.services.queue.enqueue(event);
      expect(await config.services.storage.length()).toBe(1);
    }
  });
});
