import { Exceptionless } from "../src/index.js";

describe("ExceptionlessClient", () => {
  test("can use singleton export", () => {
    Exceptionless.startup({
      apiKey: "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
      serverUrl: "http://localhost:5000",
    });

    expect(Exceptionless.config.apiKey).toBe(
      "LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw",
    );
    expect(Exceptionless.config.serverUrl).toBe("http://localhost:5000");
  });
});
