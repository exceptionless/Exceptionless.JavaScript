const path = require("path");
const fs = require("fs");

/**
 * Custom jest resolver that handles:
 * 1. Package.json "imports" field (#/ subpath imports) — per-package resolution
 * 2. TypeScript .js → .ts extension mapping for ESM imports
 *
 * Replaces jest-ts-webcompat-resolver with full #/ import support.
 */
module.exports = (request, options) => {
  // Handle #/ subpath imports by reading the nearest package.json
  if (request.startsWith("#/")) {
    const packageRoot = findPackageRoot(options.basedir);
    if (packageRoot) {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf-8"));
      if (pkgJson.imports) {
        const mapping = pkgJson.imports["#/*"];
        if (mapping) {
          const base = typeof mapping === "string" ? mapping : mapping.source || mapping.default;
          if (base) {
            const prefix = base.replace("*", "");
            const suffix = request.slice(2);
            if (suffix.includes("..") || path.isAbsolute(suffix)) {
              throw new Error(`Unsafe import path: ${request}`);
            }
            const resolved = path.resolve(packageRoot, prefix, suffix);
            const normalizedRoot = path.resolve(packageRoot) + path.sep;
            if (!resolved.startsWith(normalizedRoot)) {
              throw new Error(`Import escapes package root: ${request}`);
            }
            return resolveWithExtensions(resolved);
          }
        }
      }
    }
  }

  // Handle .js → .ts extension mapping for TypeScript ESM imports
  if (request.endsWith(".js")) {
    const tsRequest = request.slice(0, -3) + ".ts";
    try {
      return options.defaultResolver(tsRequest, options);
    } catch {
      // Try .tsx
    }
    const tsxRequest = request.slice(0, -3) + ".tsx";
    try {
      return options.defaultResolver(tsxRequest, options);
    } catch {
      // Fall through to default
    }
  }

  return options.defaultResolver(request, options);
};

function findPackageRoot(dir) {
  let current = dir;
  while (current !== path.dirname(current)) {
    if (fs.existsSync(path.join(current, "package.json"))) {
      const pkg = path.join(current, "package.json");
      const content = JSON.parse(fs.readFileSync(pkg, "utf-8"));
      if (content.imports) {
        return current;
      }
    }
    current = path.dirname(current);
  }
  return null;
}

function resolveWithExtensions(filePath) {
  const base = filePath.replace(/\.js$/, "");
  for (const ext of [".ts", ".tsx", ".js"]) {
    const fullPath = base + ext;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  throw new Error(`Cannot resolve: ${filePath}`);
}
