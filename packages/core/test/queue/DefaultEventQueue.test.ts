import { Configuration } from "../../src/configuration/Configuration.js";
import { Event } from "../../src/models/Event.js";
import { delay } from "../helpers.js";

describe("DefaultEventQueue", () => {
  let config: Configuration;

  beforeEach(() => {
    config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";
    config.serverUrl = "http://server.localhost:5000";

    expect(config.services.storage.queue.get().length).toBe(0);
  });

  afterEach(() => {
    const queue: any = config.services.queue;
    clearInterval(queue._queueTimer);
    config = null;
  });

  test("should enqueue event", () => {
    const event: Event = { type: "log", reference_id: "123454321" };
    config.services.queue.enqueue(event);
    expect(config.services.storage.queue.get().length).toBe(1);
  });

  test("should process queue", async () => {
    const event: Event = { type: "log", reference_id: "123454321" };
    config.services.queue.enqueue(event);
    expect(config.services.storage.queue.get().length).toBe(1);
    await config.services.queue.process();

    config.services.queue.onEventsPosted(() => {
      expect((config.services.queue as any)._suspendProcessingUntil).toBeUndefined();
      expect(config.services.storage.queue.get().length).toBe(0);
    });
  });

  test("should discard event submission", () => {
    config.services.queue.suspendProcessing(1, true);

    const event: Event = { type: "log", reference_id: "123454321" };
    config.services.queue.enqueue(event);
    expect(config.services.storage.queue.get().length).toBe(0);
  });

  test("should suspend processing", async () => {
    config.services.queue.suspendProcessing(.0001);

    const event: Event = { type: "log", reference_id: "123454321" };
    config.services.queue.enqueue(event);
    expect(config.services.storage.queue.get().length).toBe(1);

    await delay(25);
    if (!(config.services.queue as any)._suspendProcessingUntil) {
      expect(config.services.storage.queue.get().length).toBe(0);
    } else {
      expect(config.services.storage.queue.get().length).toBe(1);
    }
  });
});
