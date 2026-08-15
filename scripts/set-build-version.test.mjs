import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { expect, test } from "vitest";

const execFileAsync = promisify(execFile);
const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "set-build-version.mjs");

test("uses the build version environment variable", async () => {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), "exceptionless-version-"));
  const version = "3.1.0-preview.feature.1";

  try {
    await mkdir(path.join(rootDirectory, "packages/core/src/configuration"), { recursive: true });
    await mkdir(path.join(rootDirectory, "example/browser"), { recursive: true });

    const files = [
      "package.json",
      "package-lock.json",
      "packages/core/package.json",
      "packages/core/src/configuration/Configuration.ts",
      "example/browser/package.json"
    ];
    await Promise.all(files.map((file) => writeFile(path.join(rootDirectory, file), '"3.0.0-dev"')));

    const { stdout } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: rootDirectory,
      env: { ...process.env, BUILD_VERSION: version }
    });

    expect(stdout).toContain("Updated 5 version references");
    await Promise.all(
      files.map(async (file) => {
        const content = await readFile(path.join(rootDirectory, file), "utf8");
        expect(content).toBe(`"${version}"`);
      })
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});
