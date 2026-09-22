import { describe, expect, test } from "vitest";

import { Configuration } from "../src/configuration/Configuration.js";
import { ExceptionlessClient } from "../src/ExceptionlessClient.js";
import { KnownEventDataKeys } from "../src/models/Event.js";

describe("documentation examples", () => {
  test("should configure production privacy and self-hosted endpoints", () => {
    const config = new Configuration();

    config.apiKey = "UNIT_TEST_API_KEY";
    config.serverUrl = "https://collector.example.com";
    config.configServerUrl = "https://config.example.com";
    config.heartbeatServerUrl = "https://heartbeat.example.com";
    config.version = "1.2.3";
    config.defaultTags.push("core", "production");
    config.addDataExclusions("authorization", "cookie", "password", "secret", "set-cookie", "token");
    config.includePrivateInformation = false;

    expect(config.isValid).toBe(true);
    expect(config.serverUrl).toBe("https://collector.example.com");
    expect(config.configServerUrl).toBe("https://config.example.com");
    expect(config.heartbeatServerUrl).toBe("https://heartbeat.example.com");
    expect(config.version).toBe("1.2.3");
    expect(config.defaultTags).toEqual(["core", "production"]);
    expect(config.dataExclusions).toEqual(["authorization", "cookie", "password", "secret", "set-cookie", "token"]);
    expect(config.includeCookies).toBe(false);
    expect(config.includeHeaders).toBe(false);
    expect(config.includeIpAddress).toBe(false);
    expect(config.includePostData).toBe(false);
    expect(config.includeQueryString).toBe(false);
  });

  test("should build documented enriched exception events", () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    client.config.addDataExclusions("creditCardNumber");

    const error = new Error("Unable to create order from quote");
    const builder = client
      .createException(error)
      .setReferenceId("order-12345678")
      .setProperty(
        "Order",
        {
          id: "order-123",
          quoteId: 123,
          creditCardNumber: "4111111111111111"
        },
        4,
        ["securityCode"]
      )
      .setProperty("Quote", 123)
      .addTags("orders")
      .markAsCritical()
      .setGeo(43.595089, -88.444602)
      .setUserIdentity("user-123", "Jane Doe")
      .setUserDescription("jane@example.com", "The submit button returned a blank page.");

    expect(builder.target.type).toBe("error");
    expect(builder.target.reference_id).toBe("order-12345678");
    expect(builder.target.tags).toEqual(["orders", "Critical"]);
    expect(builder.target.geo).toBe("43.595089,-88.444602");
    expect(builder.target.data?.Order).toEqual({
      id: "order-123",
      quoteId: 123
    });
    expect(builder.target.data?.Quote).toBe(123);
    expect(builder.target.data?.[KnownEventDataKeys.UserInfo]).toEqual({
      identity: "user-123",
      name: "Jane Doe"
    });
    expect(builder.target.data?.[KnownEventDataKeys.UserDescription]).toEqual({
      email_address: "jane@example.com",
      description: "The submit button returned a blank page."
    });
  });

  test("should cancel events from documented runtime configuration plugins", async () => {
    const client = new ExceptionlessClient();
    client.config.apiKey = "UNIT_TEST_API_KEY";
    client.config.settings["enableCheckoutEvents"] = "false";

    client.config.addPlugin("CheckoutEventToggle", 100, (context) => {
      const enabled = context.client.config.settings["enableCheckoutEvents"];

      if (context.event.source === "checkout" && enabled === "false") {
        context.cancelled = true;
      }

      return Promise.resolve();
    });

    const context = await client.createLog("checkout", "Checkout opened", "info").submit();

    expect(context.cancelled).toBe(true);
  });

  test("should support documented session startup configuration", async () => {
    const client = new ExceptionlessClient();

    await client.startup((config) => {
      config.apiKey = "UNIT_TEST_API_KEY";
      config.setUserIdentity("user-123", "Jane Doe");
      config.useSessions(true, 60000, true);
      config.updateSettingsWhenIdleInterval = -1;
    });

    try {
      const context = await client.submitSessionStart();

      expect(client.config.sessionsEnabled).toBe(true);
      expect(client.config.currentSessionIdentifier).toMatch(/^[0-9a-f]{32}$/);
      expect(context.event.reference_id).toBe(client.config.currentSessionIdentifier);
    } finally {
      await client.suspend();
    }
  });
});
