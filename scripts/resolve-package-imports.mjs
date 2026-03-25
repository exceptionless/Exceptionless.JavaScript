import path from "node:path";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PACKAGE_IMPORT_PREFIX = "#/";
const FILE_PATTERN = /\.(?:js|d\.ts)$/;

export function rewritePackageImportSpecifiers(source, filePath, distDir) {
  const rewrite = (match, prefix, specifier, suffix) => `${prefix}${toRelativeSpecifier(filePath, distDir, specifier)}${suffix}`;

  return source
    .replace(/(from\s+["'])#\/([^"']+)(["'])/g, rewrite)
    .replace(/(import\(\s*["'])#\/([^"']+)(["']\s*\))/g, rewrite);
}

export async function rewritePackageDistImports(packageDir) {
  const distDir = path.join(packageDir, "dist");
  const files = await collectFiles(distDir);

  await Promise.all(
    files.map(async (filePath) => {
      if (!FILE_PATTERN.test(filePath)) {
        return;
      }

      const source = await readFile(filePath, "utf8");
      const rewritten = rewritePackageImportSpecifiers(source, filePath, distDir);

      if (rewritten !== source) {
        await writeFile(filePath, rewritten, "utf8");
      }
    })
  );
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function toRelativeSpecifier(filePath, distDir, specifier) {
  const targetPath = path.join(distDir, specifier);
  let relativePath = path.relative(path.dirname(filePath), targetPath).replaceAll(path.sep, "/");

  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

async function main() {
  const requestedDirectory = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : process.cwd();
  const distDirectory = path.join(requestedDirectory, "dist");
  const distStats = await stat(distDirectory).catch(() => null);

  if (!distStats?.isDirectory()) {
    throw new Error(`Expected a dist directory in ${requestedDirectory}`);
  }

  await rewritePackageDistImports(requestedDirectory);
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  await main();
}
