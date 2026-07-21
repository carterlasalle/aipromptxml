import test from "node:test";
import assert from "node:assert/strict";

import {
  createSection,
  escapeCdata,
  escapeXmlText,
  generatePromptXml,
  isValidXmlName,
  normalizeState,
} from "../src/prompt-xml.js";

test("validates XML names", () => {
  assert.equal(isValidXmlName("instructions"), true);
  assert.equal(isValidXmlName("ns:context"), true);
  assert.equal(isValidXmlName("1invalid"), false);
  assert.equal(isValidXmlName("xmlPrompt"), false);
  assert.equal(isValidXmlName("has space"), false);
});

test("escapes XML text", () => {
  assert.equal(escapeXmlText("A < B & C > D"), "A &lt; B &amp; C &gt; D");
});

test("splits embedded CDATA terminators safely", () => {
  assert.equal(escapeCdata("before ]]> after"), "before ]]]]><![CDATA[> after");
});

test("generates a rooted CDATA prompt", () => {
  const result = generatePromptXml({
    rootTag: "prompt",
    sections: [createSection("instructions", "Be concise.")],
    settings: { mode: "cdata", indent: "  ", includeDeclaration: false },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(
    result.xml,
    "<prompt>\n  <instructions><![CDATA[Be concise.]]></instructions>\n</prompt>",
  );
});

test("generates escaped text and an XML declaration", () => {
  const result = generatePromptXml({
    rootTag: "request",
    sections: [createSection("context", "A < B")],
    settings: { mode: "escaped", indent: "    ", includeDeclaration: true },
  });

  assert.equal(
    result.xml,
    '<?xml version="1.0" encoding="UTF-8"?>\n<request>\n    <context>A &lt; B</context>\n</request>',
  );
});

test("allows fragments without a root tag", () => {
  const result = generatePromptXml({
    rootTag: "",
    sections: [
      createSection("instructions", "Do the task."),
      createSection("user_query", "What changed?"),
    ],
    settings: { mode: "cdata", indent: "  ", includeDeclaration: false },
  });

  assert.equal(
    result.xml,
    "<instructions><![CDATA[Do the task.]]></instructions>\n<user_query><![CDATA[What changed?]]></user_query>",
  );
});

test("returns actionable validation errors", () => {
  const result = generatePromptXml({
    rootTag: "1prompt",
    sections: [createSection("bad tag", "content"), createSection("", "orphan")],
  });

  assert.equal(result.xml, "");
  assert.equal(result.errors.length, 3);
  assert.match(result.errors[0].message, /Root tag/);
});

test("normalizes malformed persisted state", () => {
  const state = normalizeState({
    rootTag: 7,
    sections: [{ id: null, tag: 10, content: null }],
    settings: { mode: "unknown", indent: "eight", includeDeclaration: 1 },
  });

  assert.equal(state.rootTag, "prompt");
  assert.equal(state.sections[0].tag, "");
  assert.equal(state.sections[0].content, "");
  assert.equal(state.settings.mode, "cdata");
  assert.equal(state.settings.indent, "  ");
  assert.equal(state.settings.includeDeclaration, true);
});
