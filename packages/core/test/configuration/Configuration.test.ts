import { Configuration } from "../../src/configuration/Configuration.js";

describe("Configuration", () => {
  test("should override configuration defaults", () => {
    let config = new Configuration();
    config.useDebugLogger();
    expect(config.apiKey).toBeUndefined();

    config.apiKey = "UNIT_TEST_API_KEY";
    expect(config.apiKey).toBe("UNIT_TEST_API_KEY");
    expect(config.includePrivateInformation).toBe(true);
    expect(config.includeUserName).toBe(true);
    expect(config.includeMachineName).toBe(true);
    expect(config.includeIpAddress).toBe(true);
    expect(config.includeCookies).toBe(true);
    expect(config.includePostData).toBe(true);
    expect(config.includeQueryString).toBe(true);

    config = new Configuration();
    config.includePrivateInformation = false;
    expect(config.includePrivateInformation).toBe(false);
    expect(config.includeUserName).toBe(false);
    expect(config.includeMachineName).toBe(false);
    expect(config.includeIpAddress).toBe(false);
    expect(config.includeCookies).toBe(false);
    expect(config.includePostData).toBe(false);
    expect(config.includeQueryString).toBe(false);

    config.includeMachineName = true;
    expect(config.includePrivateInformation).toBe(false);
    expect(config.includeUserName).toBe(false);
    expect(config.includeMachineName).toBe(true);
    expect(config.includeIpAddress).toBe(false);
    expect(config.includeCookies).toBe(false);
    expect(config.includePostData).toBe(false);
    expect(config.includeQueryString).toBe(false);
  });

  test("should not add duplicate plugin", () => {
    const config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";

    expect(config.plugins).not.toBeNull();
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin("test", 20, () => Promise.resolve());
    config.addPlugin("test", 20, () => Promise.resolve());
    expect(config.plugins.length).toBe(1);
  });

  test("should generate plugin name and priority", () => {
    const config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";

    expect(config.plugins).not.toBeNull();
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin(null, null, () => Promise.resolve());
    expect(config.plugins.length).toBe(1);
    expect(config.plugins[0].name).not.toBeNull();
    expect(config.plugins[0].priority).toBe(0);
  });

  test("should sort plugins by priority", () => {
    const config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";

    expect(config.plugins).not.toBeNull();
    while (config.plugins.length > 0) {
      config.removePlugin(config.plugins[0]);
    }

    config.addPlugin("3", 3, () => Promise.resolve());
    config.addPlugin("1", 1, () => Promise.resolve());
    config.addPlugin("2", 2, () => Promise.resolve());
    expect(config.plugins.length).toBe(3);
    expect(config.plugins[0].priority).toBe(1);
    expect(config.plugins[1].priority).toBe(2);
    expect(config.plugins[2].priority).toBe(3);
  });
});
