// The edits to CHANGELOG.md's Unreleased section, apart from git so `src/lib/changelog.test.ts` can drive them.

export const MARKER = /<!-- generated-through: ([0-9a-f]{7,40}) -->/;
export const UNRELEASED = "## Unreleased";

/** The Unreleased section, from its heading to the next `## ` heading or the end; null without one. */
export function findSection(file) {
  const start = file.indexOf(`${UNRELEASED}\n`);
  if (start === -1) return null;
  const after = file.indexOf("\n## ", start + 1);
  return { start, end: after === -1 ? file.length : after + 1 };
}

/** Inserts each entry at the end of its `### Group` in place; a re-render reflowed and reordered what was already there. */
function insert(section, entries, through) {
  let out = section.replace(MARKER, `<!-- generated-through: ${through} -->`);
  for (const e of entries) {
    const heading = `### ${e.group}`;
    const at = out.indexOf(`${heading}\n`);
    const line = `- ${e.text}`;
    if (at === -1) {
      // A group the section does not have yet goes at the end, which keeps this edit local.
      out = `${out.trimEnd()}\n\n${heading}\n\n${line}\n`;
      continue;
    }
    // The end of this group is the next `### ` heading, or the end.
    const nextHeading = out.indexOf("\n### ", at + 1);
    const cut = nextHeading === -1 ? out.length : nextHeading;
    const body = out.slice(at, cut).trimEnd();
    out = `${out.slice(0, at)}${body}\n${line}\n${out.slice(cut).replace(/^\n+/, "\n")}`;
  }
  return out;
}

/** The file with the entries added, leaving one blank line before a release heading that follows. */
export function addEntries(file, entries, through) {
  const { start, end } = findSection(file);
  const section = insert(file.slice(start, end), entries, through);
  const rest = file.slice(end);
  return file.slice(0, start) + (rest ? `${section.trimEnd()}\n\n` : section) + rest;
}
