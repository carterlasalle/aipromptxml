# Prompt XML Studio

A private, local-first editor for turning unstructured prompts into clean XML documents. It is the modern replacement for the original two-file **Claude Prompt XML Helper**.

**Live app:** [xmlprompt.carterlasalle.com](https://xmlprompt.carterlasalle.com)

## What changed in 2.0

- Rebuilt the interface as a responsive three-panel workspace.
- Added live XML generation and validation instead of a manual generate step.
- Added prompt templates for general prompting, summarization, extraction, code review, and research synthesis.
- Added drag-and-drop and keyboard-accessible section ordering.
- Added CDATA and escaped-text output modes, indentation controls, optional XML declarations, and fragment output.
- Added local persistence, dark mode, keyboard shortcuts, clipboard fallback, and safer downloads.
- Removed alerts, inline scripts, external assets, analytics, and all network requests.
- Added a tested generation engine, static integrity checks, and GitHub Actions CI.
- Added a real MIT license and installable web-app metadata.

## Privacy model

The app runs entirely in the browser. Prompt content is stored only in `localStorage` on the current device. There are no API calls, analytics requests, accounts, cookies, or server-side prompt storage.

## Run locally

This project uses Yarn and requires Node.js 22 or newer.

```bash
corepack enable
yarn dev
```

Open `http://127.0.0.1:4173`.

To expose the development server to other devices on your network:

```bash
yarn dev --host=0.0.0.0 --port=4173
```

## Validate the project

```bash
yarn check
```

That command runs dependency-free static integrity checks and the Node test suite.

## Project structure

```text
.
├── index.html                 # Accessible application shell
├── styles.css                # Responsive light/dark design system
├── src/
│   ├── app.js                # Browser state and interactions
│   └── prompt-xml.js         # Pure XML generation and validation engine
├── tests/
│   └── prompt-xml.test.mjs   # Node test suite
├── scripts/
│   ├── check.mjs             # Static integrity and privacy checks
│   └── dev.mjs               # Dependency-free local server
└── .github/workflows/ci.yml  # Yarn-based CI
```

## XML behavior

Prompt XML Studio validates root and section tag names before producing output. Content can be emitted in either of two modes:

- **CDATA:** best when prompt content contains code, angle brackets, or XML-like examples. Embedded `]]>` sequences are split safely.
- **Escaped text:** converts `&`, `<`, and `>` to XML entities.

A root tag is optional. Clearing it produces an XML fragment containing the configured prompt sections.

## Keyboard shortcuts

- `Cmd/Ctrl + Enter`: copy the current XML.
- `Cmd/Ctrl + Shift + K`: add a new section.

## Deployment

The app is static and requires no build command. Serve the repository root from any static host. The existing custom domain can continue serving `index.html` directly.

## License

MIT © Carter LaSalle
