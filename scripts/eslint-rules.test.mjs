import { ESLint } from "eslint";
import { expect, test } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const eslintConfigPath = path.join(repositoryRoot, "eslint.config.mjs");

async function lint(source) {
  const eslint = new ESLint({
    cwd: repositoryRoot,
    overrideConfigFile: eslintConfigPath
  });

  const [result] = await eslint.lintText(source, {
    filePath: "scripts/eslint-rule-fixture.mjs"
  });

  return result;
}

test("accepts the required control-flow and object formatting", async () => {
  const result = await lint(`
if (process.env.NODE_ENV) {
  console.log("enabled");
}

while (process.env.NODE_ENV) {
  console.log("pending");
}

const result = {
  key: "value"
};

if (result.key) {
  console.log(result.key);
}
`);

  expect(result.messages).toHaveLength(0);
});

test("requires curly braces for control-flow statements", async () => {
  const result = await lint('if (process.env.NODE_ENV) console.log("enabled");');

  expect(result.messages.map((message) => message.ruleId)).toContain("curly");
});

test("requires object braces to wrap their contents", async () => {
  const result = await lint('const result = { key: "value" };');

  expect(result.messages.map((message) => message.ruleId)).toContain("@stylistic/object-curly-newline");
});

test("requires block contents and closing braces to use separate lines", async () => {
  const result = await lint('if (process.env.NODE_ENV) { console.log("enabled"); }');

  expect(result.messages.map((message) => message.ruleId)).toContain("@stylistic/brace-style");
});

test("requires blank lines between consecutive control-flow blocks", async () => {
  const result = await lint(`
if (process.env.NODE_ENV) {
  console.log("enabled");
}
while (process.env.NODE_ENV) {
  console.log("pending");
}
`);

  expect(result.messages.map((message) => message.ruleId)).toContain("padding-line-between-statements");
});
