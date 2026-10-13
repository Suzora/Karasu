// Reads CHANGELOG.md into the "What's new" dialog's data at build time, served to the app as `virtual:changelog`.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { UNRELEASED } from "./changelog-section.mjs";

// What `release-notes.ps1` finds for a tag: a version first, a semver prerelease allowed, anything after it ignored.
const RELEASE = /^##\s+v?(\d+\.\d+\.\d+(?:-[0-9a-z-]+(?:\.[0-9a-z-]+)*)?)(?=\s|$)(.*)$/i;
const DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const HEADING = /^##\s/;
const GROUP = /^### (Added|Changed|Fixed|Removed|Security)\s*$/;
const COMMENT = /^\s*<!--(?:(?!-->).)*-->\s*$/;
const CONTINUATION = /^ {2,}\S/;
const VIRTUAL = "virtual:changelog";

/** The plain text of inline nodes: what a line says once its markup is gone. */
export function plainText(nodes) {
  return nodes.map((n) => ("text" in n ? n.text : "children" in n ? plainText(n.children) : "")).join("");
}

/** A line's id: eight hex digits of a sha256 over its text with case, spacing and closing punctuation evened out. */
export function lineId(plain) {
  const even = plain.toLowerCase().replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "").trimEnd();
  return createHash("sha256").update(even).digest("hex").slice(0, 8);
}

const space = (c) => c === undefined || /\s/.test(c);

/** The index of the next closing `**` or lone `*` at or after `from`, skipping code spans; -1 when there is none. */
function closer(s, from, delim) {
  for (let i = from; i < s.length; i++) {
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end !== -1) i = end;
    } else if (s.startsWith("**", i)) {
      if (delim === "**" && !space(s[i - 1])) return i;
      i++;
    } else if (s[i] === "*" && delim === "*" && !space(s[i - 1])) {
      return i;
    }
  }
  return -1;
}

/** Inline markdown as nodes: code spans first, then http(s) links, `**strong**` and `*em*`; the rest stays literal. */
function inline(s) {
  const out = [];
  let literal = "";
  const push = (node) => {
    if (literal) out.push({ type: "text", text: literal });
    literal = "";
    out.push(node);
  };
  for (let i = 0; i < s.length; ) {
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end > i + 1) {
        push({ type: "code", text: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    } else if (s[i] === "[") {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(s.slice(i));
      if (link) {
        if (/^https?:\/\//.test(link[2])) push({ type: "link", href: link[2], children: inline(link[1]) });
        else literal += link[0];
        i += link[0].length;
        continue;
      }
    } else if (s.startsWith("**", i)) {
      const end = space(s[i + 2]) ? -1 : closer(s, i + 2, "**");
      if (end > i + 2) {
        push({ type: "strong", children: inline(s.slice(i + 2, end)) });
        i = end + 2;
      } else {
        literal += "**";
        i += 2;
      }
      continue;
    } else if (s[i] === "*" && !space(s[i + 1])) {
      const end = closer(s, i + 1, "*");
      if (end !== -1) {
        push({ type: "em", children: inline(s.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    literal += s[i];
    i++;
  }
  if (literal) out.push({ type: "text", text: literal });
  return out;
}

const fail = (n, line, why) => {
  throw new Error(`changelog line ${n} (${JSON.stringify(line)}): ${why}`);
};

/** The file's `## ` sections as raw lines, each bullet also listed in file order for its id; the header is skipped. */
function sections(markdown) {
  const out = [];
  let section = null;
  let group = null;
  let paragraph = null;
  let bullet = null;
  markdown.split(/\r?\n/).forEach((line, index) => {
    const n = index + 1;
    if (HEADING.test(line)) {
      const release = RELEASE.exec(line);
      if (!release && line.trimEnd() !== UNRELEASED) fail(n, line, `want "${UNRELEASED}" or "## X.Y.Z — YYYY-MM-DD"`);
      const date = release ? (DATE.exec(release[2])?.[0] ?? null) : null;
      section = { line: n, heading: line, version: release?.[1] ?? null, date, intro: [], groups: [], bullets: [] };
      out.push(section);
      group = paragraph = bullet = null;
      return;
    }
    if (!section || COMMENT.test(line)) return;
    if (line.startsWith("### ")) {
      const kind = GROUP.exec(line)?.[1].toLowerCase();
      if (!kind) fail(n, line, "want ### Added, Changed, Fixed, Removed or Security");
      group = section.groups.find((g) => g.kind === kind);
      if (!group) {
        group = { kind, lines: [] };
        section.groups.push(group);
      }
      paragraph = bullet = null;
    } else if (!line.trim()) {
      paragraph = null;
    } else if (!group) {
      if (!paragraph) {
        paragraph = [];
        section.intro.push(paragraph);
      }
      paragraph.push(line.trim());
    } else if (line.startsWith("- ")) {
      bullet = { parts: [line.slice(2).trim()] };
      group.lines.push(bullet);
      section.bullets.push(bullet);
    } else if (bullet && CONTINUATION.test(line)) {
      bullet.parts.push(line.trim());
    } else {
      fail(n, line, 'a group holds only "- " bullets and their lines indented by two spaces');
    }
  });
  return out;
}

/** A version's three numbers and its prerelease identifiers, empty for a release. */
const semver = (v) => {
  const dash = v.indexOf("-");
  const core = (dash === -1 ? v : v.slice(0, dash)).split(".").map(Number);
  return { core, pre: dash === -1 ? [] : v.slice(dash + 1).split(".") };
};

/** Two prerelease identifiers in semver's order: numbers by value and below words, words by their characters. */
const identifier = (x, y) => {
  const [nx, ny] = [/^\d+$/.test(x), /^\d+$/.test(y)];
  if (nx && ny) return Number(x) - Number(y);
  if (nx !== ny) return nx ? -1 : 1;
  return x < y ? -1 : x > y ? 1 : 0;
};

/** Whether `a` comes after `b` in semver's precedence, where a prerelease sorts below its own release. */
const newer = (a, b) => {
  const [x, y] = [semver(a), semver(b)];
  const core = x.core.map((part, i) => part - y.core[i]).find((d) => d !== 0);
  if (core !== undefined) return core > 0;
  if (x.pre.length === 0 || y.pre.length === 0) return x.pre.length < y.pre.length;
  const diff = x.pre.map((part, i) => (i < y.pre.length ? identifier(part, y.pre[i]) : 0)).find((d) => d !== 0);
  return diff !== undefined ? diff > 0 : x.pre.length > y.pre.length;
};

/** One raw section as data; a repeated id within it is numbered in file order, as the same wording is the same line. */
function build(raw) {
  const counts = new Map();
  const lines = new Map(
    raw.bullets.map((b) => {
      const text = inline(b.parts.join(" "));
      const id = lineId(plainText(text));
      const count = (counts.get(id) ?? 0) + 1;
      counts.set(id, count);
      return [b, { id: count === 1 ? id : `${id}-${count}`, text }];
    }),
  );
  return {
    version: raw.version,
    date: raw.date,
    intro: raw.intro.map((p) => inline(p.join(" "))),
    groups: raw.groups.map((g) => ({ kind: g.kind, lines: g.lines.map((b) => lines.get(b)) })),
  };
}

/** The Unreleased section, the newest `releases` releases and the version of the newest one left out. */
export function readChangelog(markdown, { releases = 2 } = {}) {
  const all = sections(markdown);
  const unreleased = all.filter((s) => s.version === null);
  if (unreleased.length > 1) fail(unreleased[1].line, unreleased[1].heading, "a second Unreleased section");
  const released = all.filter((s) => s.version !== null);
  released.forEach((s, i) => {
    const above = released[i - 1];
    if (above && !newer(above.version, s.version)) fail(s.line, s.heading, `not older than ${above.version} above it`);
  });
  return {
    unreleased: unreleased.length ? build(unreleased[0]) : { version: null, date: null, intro: [], groups: [] },
    releases: released.slice(0, releases).map(build),
    newestCut: released[releases]?.version ?? null,
  };
}

/** `virtual:changelog`: the parsed file, after `edit` when given, re-read whenever the file changes. */
export function changelogPlugin({ file, releases, edit }) {
  return {
    name: "karasu-changelog",
    resolveId: (source) => (source === VIRTUAL ? `\0${VIRTUAL}` : undefined),
    load(id) {
      if (id !== `\0${VIRTUAL}`) return undefined;
      this.addWatchFile(file);
      const md = readFileSync(file, "utf8");
      return `export default ${JSON.stringify(readChangelog(edit ? edit(md) : md, { releases }))};`;
    },
  };
}
