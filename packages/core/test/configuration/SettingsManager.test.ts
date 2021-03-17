import { Configuration } from "../../src/configuration/Configuration.js";
import { SettingsManager } from "../../src/configuration/SettingsManager.js";

describe("SettingsManager", () => {
  test("should call changed handler", (done) => {
    const config = new Configuration();
    config.apiKey = "UNIT_TEST_API_KEY";

    SettingsManager.onChanged((configuration: Configuration) => {
      expect(configuration.settings).not.toBeUndefined();
      done();
    });

    SettingsManager.applySavedServerSettings(config);
    (SettingsManager as any)._handlers = [];
  });
});
