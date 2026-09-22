import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const registry = "https://npm.pkg.github.com";

export async function publishCiPackages(ref, rootDirectory = process.cwd(), run = execFileAsync) {
  if (!ref?.startsWith("refs/heads/")) {
    throw new Error("GitHub CI package publication requires a branch ref");
  }

  const tag = `ci-${ref.split("/").at(-1)}`;
  const workspaces = (await readdir(path.join(rootDirectory, "packages"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  let published = 0;
  let skipped = 0;

  for (const workspace of workspaces) {
    const { name, version } = JSON.parse(await readFile(path.join(rootDirectory, "packages", workspace, "package.json"), "utf8"));
    try {
      await run("npm", ["view", `${name}@${version}`, "version", `--registry=${registry}`], { cwd: rootDirectory });
      skipped++;
      continue;
    } catch (error) {
      if (typeof error.stderr !== "string" || !/\bE404\b/.test(error.stderr)) {
        throw error;
      }
    }

    await run("npm", ["publish", `--workspace=packages/${workspace}`, "--access=public", `--tag=${tag}`, `--registry=${registry}`], { cwd: rootDirectory });
    published++;
  }

  return { published, skipped };
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMainModule) {
  const result = await publishCiPackages(process.env.GITHUB_REF);
  console.log(`GitHub CI packages: ${result.published} published, ${result.skipped} already present`);
}
