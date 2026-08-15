import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const developmentVersion = "3.0.0-dev";
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export async function setBuildVersion(version, rootDirectory = process.cwd()) {
  if (!versionPattern.test(version)) {
    throw new Error(`Invalid build version: ${version}`);
  }

  const packageFiles = ["package.json", "package-lock.json"];
  for (const directory of ["packages", "example"]) {
    const entries = await readdir(path.join(rootDirectory, directory), { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const workspaceDirectory = path.join(rootDirectory, directory, entry.name);
      const workspaceFiles = await readdir(workspaceDirectory);
      for (const file of workspaceFiles) {
        if (/^package.*\.json$/.test(file)) {
          packageFiles.push(path.join(directory, entry.name, file));
        }
      }
    }
  }

  const files = ["packages/core/src/configuration/Configuration.ts", ...packageFiles];
  let replacementCount = 0;

  for (const file of files) {
    const filePath = path.join(rootDirectory, file);
    const content = await readFile(filePath, "utf8");
    const occurrences = content.split(developmentVersion).length - 1;
    if (occurrences === 0) {
      continue;
    }

    await writeFile(filePath, content.replaceAll(developmentVersion, version));
    replacementCount += occurrences;
  }

  if (replacementCount === 0) {
    throw new Error(`No ${developmentVersion} values found`);
  }

  return replacementCount;
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMainModule) {
  const replacementCount = await setBuildVersion(process.env.BUILD_VERSION ?? process.argv[2] ?? "");
  console.log(`Updated ${replacementCount} version references`);
}
