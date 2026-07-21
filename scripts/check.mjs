import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "styles.css",
  "src/app.js",
  "src/prompt-xml.js",
  "manifest.webmanifest",
  "icon.svg",
];

for (const path of requiredFiles) {
  const file = await stat(new URL(`../${path}`, import.meta.url));
  assert.equal(file.isFile(), true, `${path} must be a file`);
}

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /<script type="module" src="\.\/src\/app\.js"><\/script>/);
assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css" \/>/);
assert.doesNotMatch(html, /on(?:click|change|input|load)=/i, "Inline event handlers violate the CSP");

const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
assert.doesNotMatch(app, /fetch\s*\(/, "The app must remain local-only");

console.log("Static integrity checks passed.");
