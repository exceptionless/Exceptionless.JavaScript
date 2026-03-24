import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "core",
          root: "packages/core",
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              url: "http://localhost/"
            }
          },
          setupFiles: ["./test/setup.ts"]
        },
        resolve: {
          conditions: ["source"],
          alias: {
            "@exceptionless/core": path.resolve(__dirname, "packages/core/src")
          }
        }
      },
      {
        test: {
          name: "browser",
          root: "packages/browser",
          environment: "jsdom",
          environmentOptions: {
            jsdom: {
              url: "http://localhost/"
            }
          },
          setupFiles: ["../../packages/core/test/setup.ts"]
        },
        resolve: {
          conditions: ["source"],
          alias: {
            "@exceptionless/core": path.resolve(__dirname, "packages/core/src"),
            "@exceptionless/browser": path.resolve(__dirname, "packages/browser/src")
          }
        }
      },
      {
        test: {
          name: "node",
          root: "packages/node",
          environment: "node"
        },
        resolve: {
          conditions: ["source"],
          alias: {
            "@exceptionless/core": path.resolve(__dirname, "packages/core/src")
          }
        }
      }
    ]
  }
});
