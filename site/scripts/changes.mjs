// Reads the newest changelog lines for the page's "What changed" card, at build time; nobody keeps the card by hand.

const KINDS = ["added", "changed", "fixed"];

/** Splits a changelog into its `## ` sections, each with its heading and its `### Kind` bullet lists. */
function sections(markdown) {
  const out = [];
  let current = null;
  let kind = null;
  for (const line of markdown.split(/\r?\n/)) {
    const h2 = /^## (.+)$/.exec(line);
    if (h2) {
      current = { heading: h2[1].trim(), lists: { added: [], changed: [], fixed: [] } };
      out.push(current);
      kind = null;
      continue;
    }
    const h3 = /^### (\w+)/.exec(line);
    if (h3) {
      kind = h3[1].toLowerCase();
      continue;
    }
    const item = /^- (.+)$/.exec(line);
    if (current && item && KINDS.includes(kind)) current.lists[kind].push(plain(item[1]));
  }
  return out;
}

/** The page draws a line as text, so emphasis and code ticks go. */
function plain(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}

const versionOf = (heading) => /^(\d+\.\d+\.\d+)/.exec(heading)?.[1] ?? null;

/** The newest `limits[kind]` lines of each kind, newest first; the generator appends, so the last line is the newest. */
export function readChanges(markdown, limits = { added: 2, changed: 2, fixed: 1 }) {
  const all = sections(markdown);
  const unreleased = all.find((s) => s.heading === "Unreleased");
  const released = all.filter((s) => versionOf(s.heading));
  const hasLines = (s) => s && KINDS.some((k) => s.lists[k].length);
  const source = hasLines(unreleased) ? unreleased : released[0];
  const items = source
    ? KINDS.flatMap((k) => (limits[k] ? source.lists[k].slice(-limits[k]) : []).reverse().map((text) => ({ kind: k, text })))
    : [];
  return {
    version: source === unreleased ? null : versionOf(source?.heading ?? ""),
    since: source === unreleased ? versionOf(released[0]?.heading ?? "") : null,
    items,
  };
}
