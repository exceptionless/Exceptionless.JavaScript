import path from "path";
import { describe, expect, test } from "vitest";

import { rewritePackageImportSpecifiers } from "../../../scripts/resolve-package-imports.mjs";

describe("rewritePackageImportSpecifiers", () => {
  test("should rewrite top-level package imports to relative paths", () => {
    const filePath = path.resolve("packages/core/dist/index.js");
    const distDir = path.resolve("packages/core/dist");

    const result = rewritePackageImportSpecifiers('export { Configuration } from "#/configuration/Configuration.js";\n', filePath, distDir);

    expect(result).toBe('export { Configuration } from "./configuration/Configuration.js";\n');
  });

  test("should rewrite nested package imports to relative paths", () => {
    const filePath = path.resolve("packages/core/dist/submission/DefaultSubmissionClient.js");
    const distDir = path.resolve("packages/core/dist");

    const result = rewritePackageImportSpecifiers('import { SettingsManager } from "#/configuration/SettingsManager.js";\n', filePath, distDir);

    expect(result).toBe('import { SettingsManager } from "../configuration/SettingsManager.js";\n');
  });

  test("should rewrite dynamic imports to relative paths", () => {
    const filePath = path.resolve("packages/core/dist/index.js");
    const distDir = path.resolve("packages/core/dist");

    const result = rewritePackageImportSpecifiers('const module = await import("#/plugins/default/HeartbeatPlugin.js");\n', filePath, distDir);

    expect(result).toBe('const module = await import("./plugins/default/HeartbeatPlugin.js");\n');
  });
});
