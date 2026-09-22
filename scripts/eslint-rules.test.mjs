import { ESLint } from "eslint";
import { expect, test } from "vitest";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const eslintConfigPath = path.join(repositoryRoot, "eslint.config.mjs");

async function lint(source, fix = false) {
  const eslint = new ESLint({
    cwd: repositoryRoot,
    overrideConfigFile: eslintConfigPath,
    fix
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

test.each([
  'if (process.env.NODE_ENV) console.log("enabled");',
  'while (process.env.NODE_ENV) console.log("enabled");',
  "for (const key of []) console.log(key);",
  "for (const key in process.env) console.log(key);",
  "for (let i = 0; i < 1; i++) console.log(i);",
  'do console.log("enabled"); while (process.env.NODE_ENV);'
])("requires braces and produces formatter-stable control flow: %s", async (source) => {
  const result = await lint(source);
  expect(result.messages.map((message) => message.ruleId)).toContain("curly");

  const fixed = await lint(source, true);
  expect(fixed.messages).toHaveLength(0);
  const options = await resolveConfig(eslintConfigPath);
  const formatted = await format(fixed.output, {
    ...options,
    parser: "babel"
  });
  expect((await lint(formatted)).messages).toHaveLength(0);
  expect((await lint(formatted, true)).output).toBeUndefined();
});

test.each([
  'if (process.env.NODE_ENV) {\n  console.log("next");\n}',
  'while (process.env.NODE_ENV) {\n  console.log("next");\n}',
  "for (const key of []) {\n  console.log(key);\n}",
  'do {\n  console.log("next");\n} while (process.env.NODE_ENV);'
])("requires spacing before each supported control statement: %s", async (source) => {
  const result = await lint(`if (process.env.NODE_ENV) {\n  console.log("first");\n}\n${source}`);
  expect(result.messages.map((message) => message.ruleId)).toContain("padding-line-between-statements");
});

test("keeps objects, imports and destructuring compatible with Prettier", async () => {
  const source = `import { basename } from "node:path";
const { NODE_ENV } = process.env;
const empty = {};
const value = { key: NODE_ENV, empty };
if (NODE_ENV) { console.log(basename(NODE_ENV), value); } else { console.log(empty); }
`;
  const fixed = await lint(source, true);
  expect(fixed.messages).toHaveLength(0);
  const options = await resolveConfig(eslintConfigPath);
  const formatted = await format(fixed.output, {
    ...options,
    parser: "babel"
  });
  expect((await lint(formatted)).messages).toHaveLength(0);
  expect((await lint(formatted, true)).output).toBeUndefined();
});

test("the documented format command fixes inline objects before running Prettier", async () => {
  const manifest = JSON.parse(readFileSync(path.join(repositoryRoot, "package.json"), "utf8"));
  expect(manifest.scripts.format).toBe("npm run lint:fix && prettier --write .");

  const options = await resolveConfig(eslintConfigPath);
  const source = await format("console.log({ key: 1 });", {
    ...options,
    parser: "babel"
  });
  expect((await lint(source)).messages.map((message) => message.ruleId)).toContain("@stylistic/object-curly-newline");
  const fixed = await lint(source, true);
  const formatted = await format(fixed.output, {
    ...options,
    parser: "babel"
  });
  expect((await lint(formatted)).messages).toHaveLength(0);
});
