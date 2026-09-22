import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, test, vi } from "vitest";

import { publishCiPackages } from "./publish-ci-packages.mjs";

const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function createPackages() {
  const root = await mkdtemp(path.join(os.tmpdir(), "exceptionless-publish-"));
  directories.push(root);

  for (const name of ["core", "node"]) {
    const directory = path.join(root, "packages", name);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "package.json"), JSON.stringify({ name: `@exceptionless/${name}`, version: "3.1.0-test.1" }));
  }

  return root;
}

test("skips already-published workspaces and publishes only missing ones", async () => {
  const root = await createPackages();
  const calls = [];
  const run = vi.fn(async (_command, args) => {
    calls.push(args);
    if (args[0] === "view" && args[1] === "@exceptionless/node@3.1.0-test.1") {
      throw { stderr: "npm error code E404" };
    }
  });

  const result = await publishCiPackages("refs/heads/feature/dependency-refresh", root, run);

  expect(result).toEqual({ published: 1, skipped: 1 });
  expect(calls.filter((args) => args[0] === "publish")).toEqual([
    ["publish", "--workspace=packages/node", "--access=public", "--tag=ci-dependency-refresh", "--registry=https://npm.pkg.github.com"]
  ]);
});

test("does not treat registry or authentication failures as an absent package", async () => {
  const root = await createPackages();
  const failure = { stderr: "npm error code E401" };
  const run = vi.fn(async () => {
    throw failure;
  });

  await expect(publishCiPackages("refs/heads/feature/dependency-refresh", root, run)).rejects.toBe(failure);
  expect(run).toHaveBeenCalledTimes(1);
});

test("surfaces publish failures instead of treating partial publication as success", async () => {
  const root = await createPackages();
  const failure = new Error("registry refused the publish");
  const run = vi.fn(async (_command, args) => {
    if (args[0] === "view") {
      throw { stderr: "npm error code E404" };
    }
    throw failure;
  });

  await expect(publishCiPackages("refs/heads/feature/dependency-refresh", root, run)).rejects.toBe(failure);
  expect(run).toHaveBeenCalledTimes(2);
});
