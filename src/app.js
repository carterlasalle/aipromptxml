import {
  createSection,
  generatePromptXml,
  normalizeState,
} from "./prompt-xml.js";

const STORAGE_KEY = "prompt-xml-studio:v2";
const THEME_KEY = "prompt-xml-studio:theme";

const TAGS = [
  "instructions",
  "context",
  "role",
  "task",
  "constraints",
  "examples",
  "example",
  "document",
  "data",
  "reference_material",
  "user_query",
  "input",
  "output_format",
  "style_guide",
  "success_criteria",
  "tools",
];

const TEMPLATES = [
  {
    id: "structured",
    name: "Structured prompt",
    description: "A flexible starting point for most complex requests.",
    rootTag: "prompt",
    sections: [
      ["role", "You are a careful domain expert."],
      ["instructions", "Complete the task using the supplied context."],
      ["context", "Paste the background information here."],
      ["constraints", "List hard requirements, exclusions, and limits."],
      ["output_format", "Describe the exact structure of the response."],
      ["user_query", "Enter the request here."],
    ],
  },
  {
    id: "summary",
    name: "Document summary",
    description: "Summarize long source material with explicit criteria.",
    rootTag: "summary_request",
    sections: [
      ["instructions", "Summarize the document accurately and concisely."],
      ["focus", "Prioritize key findings, decisions, risks, and next steps."],
      ["document", "Paste the source document here."],
      ["output_format", "Use a short overview followed by structured bullets."],
    ],
  },
  {
    id: "extract",
    name: "Structured extraction",
    description: "Extract facts into a consistent machine-readable shape.",
    rootTag: "extraction_request",
    sections: [
      ["instructions", "Extract only information supported by the source."],
      ["schema", "Define the fields and allowed values here."],
      ["source", "Paste the source content here."],
      ["missing_data", "Use null for fields that cannot be verified."],
    ],
  },
  {
    id: "code-review",
    name: "Code review",
    description: "Review code against concrete goals and constraints.",
    rootTag: "code_review",
    sections: [
      ["role", "Act as a senior software engineer and security reviewer."],
      ["objectives", "Find correctness, security, performance, and maintainability issues."],
      ["constraints", "Do not invent issues. Rank findings by practical impact."],
      ["code", "Paste the code or diff here."],
      ["output_format", "Return prioritized findings, fixes, and a final verdict."],
    ],
  },
  {
    id: "research",
    name: "Research synthesis",
    description: "Compare sources without blurring claims or evidence.",
    rootTag: "research_task",
    sections: [
      ["research_question", "State the question to answer."],
      ["sources", "Paste the source material or source summaries here."],
      ["evaluation_criteria", "Define how claims and sources should be assessed."],
      ["instructions", "Separate established facts, disagreements, and open questions."],
      ["output_format", "Produce an executive summary and evidence-backed analysis."],
    ],
  },
];

const elements = {
  sections: document.querySelector("#sections"),
  emptyState: document.querySelector("#empty-state"),
  output: document.querySelector("#output"),
  outputShell: document.querySelector("#output-shell"),
  validation: document.querySelector("#validation"),
  rootTag: document.querySelector("#root-tag"),
  mode: document.querySelector("#content-mode"),
  indent: document.querySelector("#indent-size"),
  declaration: document.querySelector("#xml-declaration"),
  sectionCount: document.querySelector("#section-count"),
  characterCount: document.querySelector("#character-count"),
  lineCount: document.querySelector("#line-count"),
  tags: document.querySelector("#tag-library"),
  templates: document.querySelector("#template-list"),
  toast: document.querySelector("#toast"),
  confirmDialog: document.querySelector("#confirm-dialog"),
  confirmTitle: document.querySelector("#confirm-title"),
  confirmDescription: document.querySelector("#confirm-description"),
  confirmAction: document.querySelector("#confirm-action"),
  themeToggle: document.querySelector("#theme-toggle"),
};

let state = loadState();
let dragSourceId = null;
let pendingConfirmation = null;
let toastTimer = null;

initialize();

function initialize() {
  applyTheme(loadTheme());
  renderTemplates();
  renderTagLibrary();
  bindGlobalControls();
  syncControlsFromState();
  renderSections();
  updatePreview();
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeState(JSON.parse(stored));
  } catch (error) {
    console.warn("Could not load saved prompt state", error);
  }

  return normalizeState({
    rootTag: "prompt",
    sections: [
      createSection("instructions", "Describe what the model should do."),
      createSection("context", "Add the information the model needs."),
      createSection("user_query", "Enter the request here."),
    ],
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindGlobalControls() {
  document.querySelector("#add-section").addEventListener("click", () => {
    addSection("", "", true);
  });
  document.querySelector("#empty-add-section").addEventListener("click", () => {
    addSection("", "", true);
  });

  document.querySelector("#copy-output").addEventListener("click", copyOutput);
  document.querySelector("#download-output").addEventListener("click", downloadOutput);
  document.querySelector("#clear-prompt").addEventListener("click", () => {
    askForConfirmation({
      title: "Clear this prompt?",
      description: "This removes every section and resets the document settings.",
      actionLabel: "Clear prompt",
      callback: () => {
        state = normalizeState({ rootTag: "prompt", sections: [] });
        syncControlsFromState();
        renderSections();
        commitState("Prompt cleared");
      },
    });
  });

  elements.rootTag.addEventListener("input", (event) => {
    state.rootTag = event.target.value;
    commitState();
  });

  elements.mode.addEventListener("change", (event) => {
    state.settings.mode = event.target.value;
    commitState();
  });

  elements.indent.addEventListener("change", (event) => {
    state.settings.indent = event.target.value;
    commitState();
  });

  elements.declaration.addEventListener("change", (event) => {
    state.settings.includeDeclaration = event.target.checked;
    commitState();
  });

  elements.themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });

  elements.confirmDialog.addEventListener("close", () => {
    if (elements.confirmDialog.returnValue === "confirm" && pendingConfirmation) {
      pendingConfirmation();
    }
    pendingConfirmation = null;
  });

  elements.confirmAction.addEventListener("click", () => {
    elements.confirmDialog.close("confirm");
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key === "Enter") {
      event.preventDefault();
      copyOutput();
    }
    if (modifier && event.shiftKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      addSection("", "", true);
    }
  });
}

function syncControlsFromState() {
  elements.rootTag.value = state.rootTag;
  elements.mode.value = state.settings.mode;
  elements.indent.value = state.settings.indent;
  elements.declaration.checked = state.settings.includeDeclaration;
}

function renderTemplates() {
  elements.templates.replaceChildren();
  for (const template of TEMPLATES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-card";
    button.innerHTML = `
      <span class="template-name">${escapeHtml(template.name)}</span>
      <span class="template-description">${escapeHtml(template.description)}</span>
    `;
    button.addEventListener("click", () => loadTemplate(template));
    elements.templates.append(button);
  }
}

function renderTagLibrary() {
  elements.tags.replaceChildren();
  for (const tag of TAGS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-chip";
    button.textContent = `<${tag}>`;
    button.addEventListener("click", () => addSection(tag, "", true));
    elements.tags.append(button);
  }
}

function renderSections(focusId = null, focusField = "tag") {
  elements.sections.replaceChildren();
  elements.emptyState.hidden = state.sections.length > 0;

  state.sections.forEach((section, index) => {
    const card = document.createElement("article");
    card.className = "section-card";
    card.dataset.sectionId = section.id;
    card.draggable = true;
    card.innerHTML = sectionMarkup(section, index);

    const tagInput = card.querySelector(".section-tag");
    const contentInput = card.querySelector(".section-content");

    tagInput.addEventListener("input", (event) => {
      section.tag = event.target.value;
      commitState();
      updateCardValidation(card, section.id);
    });

    contentInput.addEventListener("input", (event) => {
      section.content = event.target.value;
      autoSizeTextarea(contentInput);
      card.querySelector(".content-count").textContent = `${section.content.length.toLocaleString()} chars`;
      commitState();
    });

    card.querySelector("[data-action='remove']").addEventListener("click", () => {
      state.sections = state.sections.filter((candidate) => candidate.id !== section.id);
      renderSections();
      commitState("Section removed");
    });

    card.querySelector("[data-action='duplicate']").addEventListener("click", () => {
      const clone = createSection(section.tag, section.content);
      state.sections.splice(index + 1, 0, clone);
      renderSections(clone.id, "content");
      commitState("Section duplicated");
    });

    card.querySelector("[data-action='up']").addEventListener("click", () => {
      moveSection(index, index - 1);
    });

    card.querySelector("[data-action='down']").addEventListener("click", () => {
      moveSection(index, index + 1);
    });

    card.addEventListener("dragstart", (event) => {
      dragSourceId = section.id;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", section.id);
    });

    card.addEventListener("dragend", () => {
      dragSourceId = null;
      card.classList.remove("is-dragging");
      document.querySelectorAll(".drag-over").forEach((node) => node.classList.remove("drag-over"));
    });

    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (dragSourceId && dragSourceId !== section.id) card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drag-over");
      if (!dragSourceId || dragSourceId === section.id) return;
      const fromIndex = state.sections.findIndex((item) => item.id === dragSourceId);
      const toIndex = state.sections.findIndex((item) => item.id === section.id);
      moveSection(fromIndex, toIndex);
    });

    elements.sections.append(card);
    autoSizeTextarea(contentInput);
    updateCardValidation(card, section.id);
  });

  if (focusId) {
    requestAnimationFrame(() => {
      const card = elements.sections.querySelector(`[data-section-id="${CSS.escape(focusId)}"]`);
      card?.querySelector(focusField === "content" ? ".section-content" : ".section-tag")?.focus();
    });
  }
}

function sectionMarkup(section, index) {
  return `
    <div class="section-toolbar">
      <div class="section-identity">
        <button class="drag-handle" type="button" aria-label="Drag section ${index + 1}" title="Drag to reorder">⋮⋮</button>
        <span class="section-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="section-label">Prompt section</span>
      </div>
      <div class="section-actions" aria-label="Section actions">
        <button class="icon-button" type="button" data-action="up" aria-label="Move section up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-button" type="button" data-action="down" aria-label="Move section down" ${index === state.sections.length - 1 ? "disabled" : ""}>↓</button>
        <button class="icon-button" type="button" data-action="duplicate" aria-label="Duplicate section">⧉</button>
        <button class="icon-button danger" type="button" data-action="remove" aria-label="Remove section">×</button>
      </div>
    </div>
    <div class="field-grid">
      <label class="field tag-field">
        <span>Tag name</span>
        <div class="tag-input-shell">
          <span aria-hidden="true">&lt;</span>
          <input class="section-tag" type="text" value="${escapeHtml(section.tag)}" placeholder="instructions" autocomplete="off" spellcheck="false" />
          <span aria-hidden="true">&gt;</span>
        </div>
        <span class="field-error" aria-live="polite"></span>
      </label>
      <label class="field content-field">
        <span class="field-heading"><span>Content</span><span class="content-count">${section.content.length.toLocaleString()} chars</span></span>
        <textarea class="section-content" rows="4" placeholder="Write or paste the content for this section...">${escapeHtml(section.content)}</textarea>
      </label>
    </div>
  `;
}

function updateCardValidation(card, sectionId) {
  const { errors } = generatePromptXml(state);
  const error = errors.find((item) => item.sectionId === sectionId);
  const errorNode = card.querySelector(".field-error");
  const input = card.querySelector(".section-tag");
  errorNode.textContent = error?.message ?? "";
  input.setAttribute("aria-invalid", error ? "true" : "false");
  card.classList.toggle("has-error", Boolean(error));
}

function addSection(tag = "", content = "", focus = false) {
  const section = createSection(tag, content);
  state.sections.push(section);
  renderSections(focus ? section.id : null, tag ? "content" : "tag");
  commitState(tag ? `<${tag}> added` : "Section added");
}

function moveSection(fromIndex, toIndex) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= state.sections.length ||
    toIndex >= state.sections.length ||
    fromIndex === toIndex
  ) {
    return;
  }

  const [section] = state.sections.splice(fromIndex, 1);
  state.sections.splice(toIndex, 0, section);
  renderSections(section.id, "tag");
  commitState("Section reordered");
}

function loadTemplate(template) {
  const applyTemplate = () => {
    state = normalizeState({
      rootTag: template.rootTag,
      sections: template.sections.map(([tag, content]) => createSection(tag, content)),
      settings: state.settings,
    });
    syncControlsFromState();
    renderSections();
    commitState(`${template.name} loaded`);
  };

  if (state.sections.some((section) => section.tag.trim() || section.content.trim())) {
    askForConfirmation({
      title: `Load “${template.name}”?`,
      description: "This replaces the prompt currently in the editor.",
      actionLabel: "Load template",
      callback: applyTemplate,
    });
  } else {
    applyTemplate();
  }
}

function commitState(message = "") {
  saveState();
  updatePreview();
  if (message) showToast(message);
}

function updatePreview() {
  const result = generatePromptXml(state);
  elements.output.textContent = result.xml || "Your generated XML will appear here.";
  elements.output.classList.toggle("is-placeholder", !result.xml);
  elements.outputShell.classList.toggle("has-error", result.errors.length > 0);

  elements.sectionCount.textContent = result.stats.sections.toLocaleString();
  elements.characterCount.textContent = result.stats.characters.toLocaleString();
  elements.lineCount.textContent = result.stats.lines.toLocaleString();

  if (result.errors.length > 0) {
    elements.validation.className = "validation-message error";
    elements.validation.innerHTML = `<span aria-hidden="true">●</span><span>${escapeHtml(result.errors[0].message)}</span>`;
  } else {
    elements.validation.className = "validation-message valid";
    elements.validation.innerHTML = `<span aria-hidden="true">●</span><span>Valid XML structure</span>`;
  }

  for (const card of elements.sections.querySelectorAll(".section-card")) {
    updateCardValidation(card, card.dataset.sectionId);
  }
}

async function copyOutput() {
  const { xml, errors } = generatePromptXml(state);
  if (!xml || errors.length > 0) {
    showToast(errors[0]?.message ?? "Nothing to copy", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(xml);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = xml;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  showToast("XML copied to clipboard");
}

function downloadOutput() {
  const { xml, errors } = generatePromptXml(state);
  if (!xml || errors.length > 0) {
    showToast(errors[0]?.message ?? "Nothing to download", "error");
    return;
  }

  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const fileName = state.rootTag.trim() || "prompt";
  anchor.href = url;
  anchor.download = `${fileName.replaceAll(":", "-")}.xml`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("XML downloaded");
}

function askForConfirmation({ title, description, actionLabel, callback }) {
  elements.confirmTitle.textContent = title;
  elements.confirmDescription.textContent = description;
  elements.confirmAction.textContent = actionLabel;
  pendingConfirmation = callback;
  elements.confirmDialog.showModal();
}

function showToast(message, variant = "success") {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.dataset.variant = variant;
  elements.toast.hidden = false;
  requestAnimationFrame(() => elements.toast.classList.add("is-visible"));
  toastTimer = setTimeout(() => {
    elements.toast.classList.remove("is-visible");
    setTimeout(() => {
      elements.toast.hidden = true;
    }, 180);
  }, 2400);
}

function autoSizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(132, textarea.scrollHeight)}px`;
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  elements.themeToggle.querySelector("span").textContent = theme === "dark" ? "☀" : "☾";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
