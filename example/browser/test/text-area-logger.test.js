import assert from "node:assert/strict";
import { afterEach, test } from "vitest";
import { JSDOM } from "jsdom";

import { TextAreaLogger } from "../text-area-logger.js";

let dom;
afterEach(() => {
  dom?.window.close();
  delete globalThis.document;
});

function createDocument(readyState) {
  dom = new JSDOM('<textarea id="log"></textarea>');
  globalThis.document = dom.window.document;
  Object.defineProperty(document, "readyState", { value: readyState });
  return document.getElementById("log");
}

test("logs literal text and preserves the textarea's edited value", () => {
  const element = createDocument("complete");
  element.value = "edited text";
  const logger = new TextAreaLogger("log");
  logger.info("<b>literal</b> & text");
  assert.match(element.value, /^edited text\n.* \[info\] <b>literal<\/b> & text$/);
  assert.equal(element.innerHTML, "");
});

test("flushes buffered messages when the document becomes ready", () => {
  const element = createDocument("loading");
  const logger = new TextAreaLogger("log");
  logger.info("<script>literal</script>");
  logger.warn("second message");
  assert.equal(element.value, "");
  document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  assert.match(element.value, /\[info\] <script>literal<\/script>\n.* \[warn\] second message$/);
  assert.deepEqual(logger.messageBuffer, []);
  logger.error("third message");
  assert.match(element.value, /second message\n.* \[error\] third message$/);
});

test("logs immediately when DOMContentLoaded has already fired", () => {
  const element = createDocument("interactive");
  new TextAreaLogger("log").info("ready");
  assert.match(element.value, /\[info\] ready$/);
});

test("forwards every level to the supplied logger", () => {
  createDocument("complete");
  const calls = [];
  const target = Object.fromEntries(["trace", "info", "warn", "error"].map((level) => [level, (message) => calls.push([level, message])]));
  const logger = new TextAreaLogger("log", target);
  for (const level of ["trace", "info", "warn", "error"]) logger[level](level);
  assert.deepEqual(calls, [
    ["trace", "trace"],
    ["info", "info"],
    ["warn", "warn"],
    ["error", "error"]
  ]);
});

test("requires an element id", () => {
  assert.throws(() => new TextAreaLogger(""), /elementId is required/);
});
