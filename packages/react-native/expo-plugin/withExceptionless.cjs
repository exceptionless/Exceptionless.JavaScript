const pkg = require("../package.json");

const withExceptionless = (config) => config;

let plugin;

try {
  const { createRunOncePlugin } = require("@expo/config-plugins");
  plugin = createRunOncePlugin(withExceptionless, pkg.name, pkg.version);
} catch {
  plugin = withExceptionless;
}

module.exports = plugin;
module.exports.default = plugin;
module.exports.withExceptionless = withExceptionless;
