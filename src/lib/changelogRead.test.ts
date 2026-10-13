// @ts-expect-error the app's tsconfig carries no Node types, and this is the one test that writes a file
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
// @ts-expect-error the app's tsconfig carries no Node types; the plugin's test file goes in the system's temp folder
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { changelogPlugin, lineId, plainText, readChangelog } from "../../scripts/changelog-read.mjs";
import { addEntries } from "../../scripts/changelog-section.mjs";
import type { MdInline } from "./anilistMarkdown";
import type { ChangeSection } from "./whatsNew";

/** `scripts/changelog-read.mjs`: CHANGELOG.md as the "What's new" dialog's data, read once at build time. */

const HEADER = [
  "# Changelog",
  "",
  "Prose about the file, naming `## Unreleased` mid-line.",
  "",
  "    node scripts/changelog.mjs",
  "    Changelog: Fixed: A declined update no longer re-downloads every day.",
  "",
  "1. rename `## Unreleased` to `## <version>`,",
  "",
];

const md = (...lines: string[]) => [...HEADER, ...lines, ""].join("\n");
const at = (n: number) => HEADER.length + n;
const text = (t: string): MdInline => ({ type: "text", text: t });
const EMPTY: ChangeSection = { version: null, date: null, intro: [], groups: [] };

/** The section's groups as kinds and plain lines, for the tests about structure rather than markup. */
const outline = (s: ChangeSection) => s.groups.map((g) => [g.kind, g.lines.map((l) => plainText(l.text))]);

/** The one line of a release that holds a single bullet, for the inline tests. */
const bullet = (line: string) => readChangelog(md("## 1.0.0", "", "### Added", "", `- ${line}`)).releases[0].groups[0].lines[0].text;

describe("sections", () => {
  it("skips the header, its indented examples and its mid-line headings, and reads an empty Unreleased", () => {
    expect(readChangelog(md("## Unreleased", "", "<!-- generated-through: ea8dcb0 -->", ""))).toEqual({
      unreleased: EMPTY,
      releases: [],
      newestCut: null,
    });
  });

  it("answers an empty Unreleased for a file without one", () => {
    const log = readChangelog(md("## 1.0.0 — 2026-09-05", "", "### Fixed", "", "- A fix."));
    expect(log.unreleased).toEqual(EMPTY);
    expect(log.releases.map((r) => [r.version, r.date])).toEqual([["1.0.0", "2026-09-05"]]);
  });

  it("reads a release's date after any dash, and none at all", () => {
    const log = readChangelog(md("## 1.2.0 – 2026-10-03", "## 1.1.0 - 2026-09-30", "## 1.0.0", "## 0.9.0 — 2026-09-01  "), { releases: 4 });
    expect(log.releases.map((r) => [r.version, r.date])).toEqual([
      ["1.2.0", "2026-10-03"],
      ["1.1.0", "2026-09-30"],
      ["1.0.0", null],
      ["0.9.0", "2026-09-01"],
    ]);
  });

  it("reads every heading the release-notes slicer finds: a v, spacing, a prerelease and text after the version", () => {
    const log = readChangelog(
      md("## v1.45.0 — 2026-10-20 (Stable)", "##  1.45.0-rc.2 – 2026-10-18", "## V1.45.0-rc.1", "## 1.44.0 (2026-10-12)", "##\t1.43.0"),
      { releases: 5 },
    );
    expect(log.releases.map((r) => [r.version, r.date])).toEqual([
      ["1.45.0", "2026-10-20"],
      ["1.45.0-rc.2", "2026-10-18"],
      ["1.45.0-rc.1", null],
      ["1.44.0", "2026-10-12"],
      ["1.43.0", null],
    ]);
  });

  it("joins an intro's wrapped lines and keeps its paragraphs apart", () => {
    const log = readChangelog(
      md("## 1.32.0 — 2026-10-03", "", "The first **Stable** release", "since 1.0.0.", "", "Second paragraph.", "", "### Added", "", "- A."),
    );
    expect(log.releases[0].intro).toEqual([
      [text("The first "), { type: "strong", children: [text("Stable")] }, text(" release since 1.0.0.")],
      [text("Second paragraph.")],
    ]);
  });

  it("keeps the groups in the file's order, Removed and Security included", () => {
    const log = readChangelog(
      md("## Unreleased", "", "### Fixed", "- F.", "### Added", "- A.", "### Removed", "- R.", "### Security", "- S.", "### Changed", "- C."),
    );
    expect(outline(log.unreleased)).toEqual([
      ["fixed", ["F."]],
      ["added", ["A."]],
      ["removed", ["R."]],
      ["security", ["S."]],
      ["changed", ["C."]],
    ]);
  });

  it("merges a repeated group into the first of its kind", () => {
    const log = readChangelog(md("## Unreleased", "", "### Added", "", "- A.", "", "### Fixed", "", "- F.", "", "### Added", "", "- B."));
    expect(outline(log.unreleased)).toEqual([
      ["added", ["A.", "B."]],
      ["fixed", ["F."]],
    ]);
  });

  it("joins a bullet's indented continuation lines, across a blank line too", () => {
    const log = readChangelog(md("## Unreleased", "", "### Fixed", "", "- A long line", "  that wraps", "", "    and goes on.", "- Next."));
    expect(outline(log.unreleased)).toEqual([["fixed", ["A long line that wraps and goes on.", "Next."]]]);
  });
});

describe("what the reader refuses", () => {
  it("throws on a section heading it does not know, naming the line", () => {
    for (const heading of ["## Notes", "## [1.2.0] — 2026-10-03", "## 1.2.0.5", "## 1.2.0- rc", "## Version 1.2.0", "##  Unreleased"]) {
      expect(() => readChangelog(md("## Unreleased", "", heading)), heading).toThrow(`line ${at(3)}`);
    }
    expect(() => readChangelog(md("## Unreleased", "", "## Notes"))).toThrow("## Notes");
  });

  it("throws on a second Unreleased", () => {
    expect(() => readChangelog(md("## Unreleased", "", "## Unreleased"))).toThrow(`line ${at(3)}`);
  });

  it("throws on a group heading it does not know, naming the line", () => {
    expect(() => readChangelog(md("## Unreleased", "", "### Notes", "", "- A."))).toThrow(`line ${at(3)}`);
    expect(() => readChangelog(md("## Unreleased", "", "### added", "", "- A."))).toThrow("### added");
  });

  it("throws on anything in a group that is not a bullet", () => {
    expect(() => readChangelog(md("## Unreleased", "", "### Fixed", "", "- A.", "", "A paragraph after it."))).toThrow(`line ${at(7)}`);
    expect(() => readChangelog(md("## Unreleased", "", "### Fixed", "", "* A star bullet."))).toThrow(`line ${at(5)}`);
    expect(() => readChangelog(md("## Unreleased", "", "### Fixed", "", "  A continuation with nothing to continue."))).toThrow(`line ${at(5)}`);
    expect(() => readChangelog(md("## Unreleased", "", "### Fixed", "", "- A.", " One space is not a continuation."))).toThrow(`line ${at(6)}`);
  });

  it("throws when the releases are not newest first, comparing numbers rather than text", () => {
    expect(() => readChangelog(md("## 1.0.0", "", "## 1.1.0"))).toThrow(`line ${at(3)}`);
    expect(() => readChangelog(md("## 1.0.0", "", "## 1.0.0"))).toThrow(`line ${at(3)}`);
    expect(readChangelog(md("## 1.10.0", "", "## 1.9.0")).releases.map((r) => r.version)).toEqual(["1.10.0", "1.9.0"]);
  });

  it("orders prereleases as semver does: below their release, identifiers one by one, numbers below words", () => {
    const order = (...versions: string[]) => readChangelog(md(...versions.map((v) => `## ${v}`)), { releases: 9 }).releases.length;
    expect(order("1.45.0", "1.45.0-rc.10", "1.45.0-rc.2", "1.45.0-rc.1.1", "1.45.0-rc.1", "1.45.0-rc", "1.45.0-beta", "1.45.0-1", "1.44.0")).toBe(9);
    for (const [above, below] of [
      ["1.45.0-rc.1", "1.45.0"],
      ["1.45.0-rc.2", "1.45.0-rc.10"],
      ["1.45.0-rc", "1.45.0-rc.1"],
      ["1.45.0-1", "1.45.0-alpha"],
      ["1.45.0-rc.1", "1.45.0-rc.1"],
      ["1.44.0", "1.45.0-rc.1"],
    ]) {
      expect(() => readChangelog(md(`## ${above}`, "", `## ${below}`)), `${above} above ${below}`).toThrow(`line ${at(3)}`);
    }
  });
});

describe("inline markup", () => {
  it("reads strong, em and code, nested where they nest", () => {
    expect(bullet("**bold** and *em*")).toEqual([
      { type: "strong", children: [text("bold")] },
      text(" and "),
      { type: "em", children: [text("em")] },
    ]);
    expect(bullet("**a *b* c** `d`")).toEqual([
      { type: "strong", children: [text("a "), { type: "em", children: [text("b")] }, text(" c")] },
      text(" "),
      { type: "code", text: "d" },
    ]);
  });

  it("reads a code span before anything else, inside and around strong", () => {
    expect(bullet("`a**b` and `*c*`")).toEqual([{ type: "code", text: "a**b" }, text(" and "), { type: "code", text: "*c*" }]);
    expect(bullet("**x `**` y**")).toEqual([{ type: "strong", children: [text("x "), { type: "code", text: "**" }, text(" y")] }]);
  });

  it("links to http and https only, and keeps any other link as it was written", () => {
    expect(bullet("Fixed ([#50](https://github.com/Suzora/Karasu/issues/50)).")).toEqual([
      text("Fixed ("),
      { type: "link", href: "https://github.com/Suzora/Karasu/issues/50", children: [text("#50")] },
      text(")."),
    ]);
    expect(bullet("[`x`](http://a.example)")).toEqual([{ type: "link", href: "http://a.example", children: [{ type: "code", text: "x" }] }]);
    expect(bullet("See [the guide](CONTRIBUTING.md) or [mail](mailto:a@b.example).")).toEqual([
      text("See [the guide](CONTRIBUTING.md) or [mail](mailto:a@b.example)."),
    ]);
  });

  it("leaves everything else literal", () => {
    for (const line of [
      "An unmatched ** stays as it is.",
      "So does a lone *, and 2 * 3 * 4.",
      "<img> tags, ~~~centred~~~ text and @name stay text.",
      "A bare https://anilist.co link and <b>HTML</b> stay text.",
      "A lone ` backtick stays.",
    ]) {
      expect(bullet(line), line).toEqual([text(line)]);
    }
  });
});

describe("line ids", () => {
  it("is eight hex digits of the plain text, pinned so a build never renames a line", () => {
    expect(lineId("Lists can be sorted by the date you last changed an entry.")).toBe("118a07b0");
  });

  it("ignores case, markup, spacing and the closing punctuation, and nothing else", () => {
    const id = lineId("Lists can be sorted by the date you last changed an entry.");
    expect(lineId(plainText(bullet("**Lists** can be  sorted by the `date` you last changed an entry!")))).toBe(id);
    expect(lineId("  lists can be sorted\tby the date you last changed an entry  ")).toBe(id);
    expect(lineId("Lists can be sorted by the date you first changed an entry.")).not.toBe(id);
  });

  it("gives each line the id of its plain text, numbering a repeat within one section", () => {
    const log = readChangelog(
      md("## Unreleased", "", "### Added", "", "- Same line.", "### Fixed", "", "- same line", "### Added", "", "- **Same** line!", "", "## 1.0.0", "", "### Fixed", "", "- Same line."),
    );
    const id = lineId("same line");
    expect(log.unreleased.groups.map((g) => g.lines.map((l) => l.id))).toEqual([[id, `${id}-3`], [`${id}-2`]]);
    expect(log.releases[0].groups[0].lines[0].id).toBe(id);
  });
});

describe("how many releases a build carries", () => {
  const file = md("## Unreleased", "", "## 3.0.0", "", "## 2.0.0", "", "## 1.0.0");
  const cut = (releases?: number) => {
    const log = readChangelog(file, releases === undefined ? undefined : { releases });
    return [log.releases.map((r) => r.version), log.newestCut];
  };

  it("carries the newest two by default and names the newest it left out", () => {
    expect(cut()).toEqual([["3.0.0", "2.0.0"], "1.0.0"]);
    expect(cut(1)).toEqual([["3.0.0"], "2.0.0"]);
    expect(cut(0)).toEqual([[], "3.0.0"]);
  });

  it("names nothing once every release fits", () => {
    expect(cut(3)).toEqual([["3.0.0", "2.0.0", "1.0.0"], null]);
    expect(cut(9)).toEqual([["3.0.0", "2.0.0", "1.0.0"], null]);
  });
});

describe("the real CHANGELOG.md", () => {
  const real = Object.values(import.meta.glob("/CHANGELOG.md", { query: "?raw", import: "default", eager: true }))[0] as string;
  const log = readChangelog(real, { releases: 99 });
  const sections = [log.unreleased, ...log.releases];

  /** Every text node under these nodes, however deep. */
  const texts = (nodes: MdInline[]): string[] =>
    nodes.flatMap((n) => (n.type === "text" ? [n.text] : "children" in n ? texts(n.children) : []));

  it("parses whole, every release in it", () => {
    expect(log.newestCut).toBeNull();
    expect(log.releases.length).toBeGreaterThan(0);
  });

  it("finds every bullet the file holds", () => {
    const body = real.split(/\r?\n/);
    const first = body.findIndex((l) => l.startsWith("## "));
    const written = body.slice(first).filter((l) => /^- /.test(l)).length;
    const parsed = sections.flatMap((s) => s.groups.flatMap((g) => g.lines)).length;
    expect(parsed).toBe(written);
  });

  it("leaves no markup behind in any text", () => {
    const all = sections.flatMap((s) => [...s.intro.flatMap(texts), ...s.groups.flatMap((g) => g.lines.flatMap((l) => texts(l.text)))]);
    expect(all.filter((t) => t.includes("**") || t.includes("`") || t.includes("]("))).toEqual([]);
  });

  it("gives every release a version, at least one group, and a well-formed date where it names one", () => {
    for (const r of log.releases) {
      expect(r.version, JSON.stringify(r.intro[0])).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
      if (r.date !== null) expect(r.date, r.version!).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.groups.length, r.version!).toBeGreaterThan(0);
    }
  });
});

describe("changelogPlugin", () => {
  it("serves the edited file as virtual:changelog and watches it", () => {
    const dir: string = mkdtempSync(`${tmpdir()}/karasu-changelog-`);
    const file = `${dir}/CHANGELOG.md`;
    writeFileSync(file, md("## Unreleased", "", "<!-- generated-through: ea8dcb0 -->", "", "## 1.1.0", "", "### Fixed", "", "- A fix.", "", "## 1.0.0"));
    try {
      const plugin = changelogPlugin({ file, releases: 1, edit: (s) => addEntries(s, [{ group: "Added", text: "New." }], "0000000") });
      const resolveId = plugin.resolveId as (source: string) => string | undefined;
      expect(resolveId("virtual:changelog")).toBe("\0virtual:changelog");
      expect(resolveId("virtual:changes")).toBeUndefined();
      const watched: string[] = [];
      const load = plugin.load as (this: { addWatchFile(f: string): void }, id: string) => string | undefined;
      const code = load.call({ addWatchFile: (f) => watched.push(f) }, "\0virtual:changelog") ?? "";
      expect(watched).toEqual([file]);
      expect(code).toMatch(/^export default \{.*\};$/);
      expect(JSON.parse(code.slice("export default ".length, -1))).toEqual({
        unreleased: { ...EMPTY, groups: [{ kind: "added", lines: [{ id: lineId("new"), text: [text("New.")] }] }] },
        releases: [{ version: "1.1.0", date: null, intro: [], groups: [{ kind: "fixed", lines: [{ id: lineId("a fix"), text: [text("A fix.")] }] }] }],
        newestCut: "1.0.0",
      });
      expect(load.call({ addWatchFile: () => {} }, "\0virtual:changes")).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
