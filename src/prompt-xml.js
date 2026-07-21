export const XML_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9._:-]*$/;

export const DEFAULT_SETTINGS = Object.freeze({
  mode: "cdata",
  indent: "  ",
  includeDeclaration: false,
});

export function isValidXmlName(value) {
  if (typeof value !== "string") return false;
  const name = value.trim();
  return XML_NAME_PATTERN.test(name) && !/^xml/i.test(name);
}

export function escapeXmlText(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function escapeCdata(value = "") {
  return String(value).replaceAll("]]>", "]]]]><![CDATA[>");
}

export function createSection(tag = "", content = "") {
  return {
    id: createId(),
    tag: String(tag),
    content: String(content),
  };
}

export function normalizeState(input = {}) {
  const settings = input.settings ?? {};
  const sections = Array.isArray(input.sections) ? input.sections : [];

  return {
    rootTag: typeof input.rootTag === "string" ? input.rootTag : "prompt",
    sections: sections.map((section) => ({
      id: typeof section?.id === "string" && section.id ? section.id : createId(),
      tag: typeof section?.tag === "string" ? section.tag : "",
      content: typeof section?.content === "string" ? section.content : "",
    })),
    settings: {
      mode: settings.mode === "escaped" ? "escaped" : "cdata",
      indent: ["  ", "    ", "\t"].includes(settings.indent)
        ? settings.indent
        : DEFAULT_SETTINGS.indent,
      includeDeclaration: Boolean(settings.includeDeclaration),
    },
  };
}

export function validatePromptState(input) {
  const state = normalizeState(input);
  const errors = [];
  const activeSections = state.sections.filter(
    (section) => section.tag.trim() || section.content.trim(),
  );

  if (state.rootTag.trim() && !isValidXmlName(state.rootTag)) {
    errors.push({
      field: "rootTag",
      message:
        "Root tag must be a valid XML name and cannot begin with “xml”.",
    });
  }

  activeSections.forEach((section, index) => {
    const tag = section.tag.trim();
    if (!tag) {
      errors.push({
        field: "section",
        sectionId: section.id,
        message: `Section ${index + 1} needs a tag name.`,
      });
      return;
    }

    if (!isValidXmlName(tag)) {
      errors.push({
        field: "section",
        sectionId: section.id,
        message: `“${tag}” is not a valid XML tag name.`,
      });
    }
  });

  if (!state.rootTag.trim() && activeSections.length === 0) {
    errors.push({
      field: "document",
      message: "Add at least one section or provide a root tag.",
    });
  }

  return { state, activeSections, errors };
}

export function generatePromptXml(input) {
  const { state, activeSections, errors } = validatePromptState(input);
  if (errors.length > 0) {
    return { xml: "", errors, stats: getStats("", activeSections) };
  }

  const rootTag = state.rootTag.trim();
  const baseLevel = rootTag ? 1 : 0;
  const body = activeSections
    .map((section) => renderSection(section, baseLevel, state.settings))
    .join("\n");

  const pieces = [];
  if (state.settings.includeDeclaration) {
    pieces.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  if (rootTag) {
    const rootBody = body ? `\n${body}\n` : "";
    pieces.push(`<${rootTag}>${rootBody}</${rootTag}>`);
  } else {
    pieces.push(body);
  }

  const xml = pieces.filter(Boolean).join("\n");
  return { xml, errors: [], stats: getStats(xml, activeSections) };
}

function renderSection(section, level, settings) {
  const indent = settings.indent.repeat(level);
  const nestedIndent = settings.indent.repeat(level + 1);
  const tag = section.tag.trim();
  const content = section.content;

  if (settings.mode === "escaped") {
    if (!content.includes("\n")) {
      return `${indent}<${tag}>${escapeXmlText(content)}</${tag}>`;
    }

    const escapedLines = content
      .split("\n")
      .map((line) => `${nestedIndent}${escapeXmlText(line)}`)
      .join("\n");
    return `${indent}<${tag}>\n${escapedLines}\n${indent}</${tag}>`;
  }

  const safeContent = escapeCdata(content);
  if (!safeContent.includes("\n")) {
    return `${indent}<${tag}><![CDATA[${safeContent}]]></${tag}>`;
  }

  return `${indent}<${tag}><![CDATA[\n${safeContent}\n]]></${tag}>`;
}

function getStats(xml, sections) {
  return {
    sections: sections.length,
    characters: xml.length,
    lines: xml ? xml.split("\n").length : 0,
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
