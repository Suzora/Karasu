import { test } from "node:test";
import assert from "node:assert/strict";
import { readChanges } from "./changes.mjs";

const md = `# Changelog

Intro text.

## Unreleased

<!-- generated-through: abc -->

### Fixed

- Old fix.
- New fix.

### Added

- Old add.
- Middle add.
- New add.

### Changed

- Old change.
- New change.

## 1.32.0 — 2026-10-03

Prose.

### Added

- Released add.
`;

test("takes the newest lines of each kind from Unreleased, newest first, and names the release they follow", () => {
  const c = readChanges(md, { added: 2, changed: 2, fixed: 1 });
  assert.equal(c.version, null);
  assert.equal(c.since, "1.32.0");
  assert.deepEqual(c.items, [
    { kind: "added", text: "New add." },
    { kind: "added", text: "Middle add." },
    { kind: "changed", text: "New change." },
    { kind: "changed", text: "Old change." },
    { kind: "fixed", text: "New fix." },
  ]);
});

test("falls back to the newest release when Unreleased is empty", () => {
  const empty = md.replace(/### Fixed[\s\S]*?(?=## 1\.32)/, "");
  const c = readChanges(empty, { added: 2, changed: 2, fixed: 1 });
  assert.equal(c.version, "1.32.0");
  assert.equal(c.since, null);
  assert.deepEqual(c.items, [{ kind: "added", text: "Released add." }]);
});

test("drops markdown emphasis and code ticks, which the page draws as plain text", () => {
  const c = readChanges(md.replace("New add.", "A **bold** `code` add."), { added: 1, changed: 0, fixed: 0 });
  assert.equal(c.items[0].text, "A bold code add.");
});
