const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo packages for local SDK changes.
config.watchFolders = [monorepoRoot];

// Resolve packages from the example first, then the monorepo root.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules"), path.resolve(monorepoRoot, "node_modules")];

module.exports = config;
