import { describe, expect, it } from "vitest";
import {
  browseView,
  compareVersions,
  coreOf,
  firstLines,
  isRelease,
  lineCount,
  linesToRecord,
  pendingChanges,
  shouldRecord,
  upToDate,
  versionParts,
  type ChangeGroup,
  type ChangeSection,
  type Changelog,
  type GroupKind,
  type Seen,
} from "./whatsNew";

const group = (kind: GroupKind, ...ids: string[]): ChangeGroup => ({
  kind,
  lines: ids.map((id) => ({ id, text: [{ type: "text", text: `line ${id}` }] })),
});

const section = (version: string | null, ...groups: ChangeGroup[]): ChangeSection => ({
  version,
  date: version ? "2026-10-12" : null,
  intro: [],
  groups,
});

const unreleased = (...groups: ChangeGroup[]) => section(null, ...groups);
const log = (open: ChangeSection, releases: ChangeSection[], newestCut: string | null = null): Changelog => ({
  unreleased: open,
  releases,
  newestCut,
});

/** A mark on the Nightly channel unless a test is about the Stable one. */
const seen = (current: string, version: string | null, lines: string[] | null = [], channel = "prerelease"): Seen => ({
  current,
  version,
  lines,
  channel,
});

const R144 = section("1.44.0", group("added", "a1440001"), group("fixed", "f1440001"));
const R143 = section("1.43.0", group("changed", "c1430001"));
const R132 = section("1.32.0", group("added", "a1320001"));

/** A Nightly's Unreleased section: three groups, five lines. */
const NIGHTLY = unreleased(group("added", "aaaaaaaa", "bbbbbbbb"), group("fixed", "cccccccc"), group("changed", "dddddddd", "eeeeeeee"));

describe("versionParts", () => {
  it("reads the four segments and treats + like .", () => {
    expect(versionParts("1.44.9.882")).toEqual([1, 44, 9, 882]);
    expect(versionParts("0.23.2+90")).toEqual([0, 23, 2, 90]);
  });

  it("reads a part Rust's u32 parse refuses as 0", () => {
    expect(versionParts("1a")).toEqual([0]);
    expect(versionParts("")).toEqual([0]);
    expect(versionParts("screens")).toEqual([0]);
    expect(versionParts("1..2")).toEqual([1, 0, 2]);
    expect(versionParts("-1.2")).toEqual([0, 2]);
    expect(versionParts(" 1.2")).toEqual([0, 2]);
    expect(versionParts("0x1.2")).toEqual([0, 2]);
    expect(versionParts("1e3.2")).toEqual([0, 2]);
  });

  it("keeps leading zeros and the u32 range", () => {
    expect(versionParts("007.1")).toEqual([7, 1]);
    expect(versionParts("4294967295")).toEqual([4294967295]);
    expect(versionParts("4294967296")).toEqual([0]);
    expect(versionParts("99999999999999999999")).toEqual([0]);
  });
});

describe("compareVersions", () => {
  it("orders by segment, numerically", () => {
    expect(compareVersions("0.2.0", "0.1.0")).toBe(1);
    expect(compareVersions("1.0.0", "0.9.9")).toBe(1);
    expect(compareVersions("0.1.0", "0.2.0")).toBe(-1);
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("0.1.0", "0.1.0")).toBe(0);
  });

  it("counts a missing part as 0", () => {
    expect(compareVersions("0.1", "0.1.0")).toBe(0);
    expect(compareVersions("0.1.0.1", "0.1.0")).toBe(1);
    expect(compareVersions("0.1.0", "0.1.0.1")).toBe(-1);
  });

  it("reads semver build metadata as the fourth segment", () => {
    expect(compareVersions("0.23.2+90", "0.23.2.90")).toBe(0);
    expect(compareVersions("0.23.2+90", "0.23.1.89")).toBe(1);
    expect(compareVersions("0.23.1+88", "0.23.1.89")).toBe(-1);
  });

  it("reads a non-numeric version as zeros, as version_gt does", () => {
    expect(compareVersions("latest", "0.19.2.82")).toBe(-1);
    expect(compareVersions("screens", "0")).toBe(0);
    expect(compareVersions("1a", "0.0.0.0")).toBe(0);
  });
});

describe("coreOf", () => {
  it("keeps the first three parts and drops the commit number", () => {
    expect(coreOf("1.44.9.882")).toBe("1.44.9");
    expect(coreOf("1.44.0+873")).toBe("1.44.0");
  });

  it("fills missing parts with 0", () => {
    expect(coreOf("1.44")).toBe("1.44.0");
    expect(coreOf("screens")).toBe("0.0.0");
  });
});

describe("isRelease", () => {
  const changelog = log(NIGHTLY, [R144, R143], "1.32.0");

  it("knows a bundled release and the newest one left out", () => {
    expect(isRelease(changelog, "1.44.0.873")).toBe(true);
    expect(isRelease(changelog, "1.43.0+850")).toBe(true);
    expect(isRelease(changelog, "1.32.0.763")).toBe(true);
  });

  it("calls anything else a Nightly", () => {
    expect(isRelease(changelog, "1.44.9.882")).toBe(false);
    expect(isRelease(changelog, "1.0.0.500")).toBe(false);
    expect(isRelease(log(NIGHTLY, []), "1.44.0.873")).toBe(false);
  });
});

describe("upToDate", () => {
  it("is true only for the same build with lines recorded", () => {
    expect(upToDate(seen("1.44.9.882", "1.44.9.882", ["aaaaaaaa"]))).toBe(true);
    expect(upToDate(seen("1.44.9.882", "1.44.9.882", []))).toBe(true);
    expect(upToDate(seen("1.44.9.882", "1.44.9.882", null))).toBe(false);
    expect(upToDate(seen("1.44.9.882", "1.44.8.881", []))).toBe(false);
    expect(upToDate(seen("1.44.9.882", null, null))).toBe(false);
  });
});

describe("shouldRecord", () => {
  it("records a first start, the same build and an upgrade", () => {
    expect(shouldRecord(seen("1.44.9.882", null, null))).toBe(true);
    expect(shouldRecord(seen("1.44.9.882", "1.44.9.882"))).toBe(true);
    expect(shouldRecord(seen("1.44.9.882", "1.44.8.881"))).toBe(true);
  });

  it("never records over a newer mark", () => {
    expect(shouldRecord(seen("1.44.8.881", "1.44.9.882"))).toBe(false);
  });
});

describe("linesToRecord", () => {
  it("lists every Unreleased line in order", () => {
    expect(linesToRecord(log(NIGHTLY, [R144]))).toEqual(["aaaaaaaa", "bbbbbbbb", "cccccccc", "dddddddd", "eeeeeeee"]);
  });

  it("is empty when Unreleased is", () => {
    expect(linesToRecord(log(unreleased(), [R144]))).toEqual([]);
  });
});

describe("browseView", () => {
  it("opens a Nightly on its Unreleased lines, with every bundled release folded under them", () => {
    expect(browseView(log(NIGHTLY, [R144, R143]))).toEqual({ primary: NIGHTLY, folds: [R144, R143] });
  });

  it("opens a Stable on its own release when Unreleased holds no line", () => {
    expect(browseView(log(unreleased(), [R144, R143]))).toEqual({ primary: R144, folds: [R143] });
    expect(browseView(log(unreleased(group("fixed")), [R144]))).toEqual({ primary: R144, folds: [] });
  });

  it("has nothing to open on when the build bundles nothing", () => {
    expect(browseView(log(unreleased(), []))).toEqual({ primary: null, folds: [] });
  });
});

describe("the compact view", () => {
  const long = section("1.44.0", group("added", "a1", "a2", "a3"), group("changed", "c1", "c2"), group("fixed", "f1", "f2"));

  it("counts every line of a section", () => {
    expect(lineCount(long)).toBe(7);
    expect(lineCount(unreleased())).toBe(0);
  });

  it("keeps the first five lines in file order, without the intro and the groups left empty", () => {
    const withIntro = { ...long, intro: [[{ type: "text" as const, text: "The intro." }]] };
    expect(firstLines(withIntro)).toEqual({
      ...long,
      intro: [],
      groups: [group("added", "a1", "a2", "a3"), group("changed", "c1", "c2")],
    });
  });

  it("cuts inside a group", () => {
    expect(firstLines(long, 4)?.groups).toEqual([group("added", "a1", "a2", "a3"), group("changed", "c1")]);
  });

  it("leaves a section of six lines or fewer whole", () => {
    expect(firstLines(section("1.44.0", group("added", "a1", "a2", "a3"), group("fixed", "f1", "f2", "f3")))).toBeNull();
    expect(firstLines(NIGHTLY)).toBeNull();
  });
});

describe("pendingChanges", () => {
  it("shows nothing after a downgrade or a channel switch", () => {
    expect(pendingChanges(log(NIGHTLY, [R144]), seen("1.44.8.881", "1.44.9.882"))).toBeNull();
  });

  it("shows nothing for the same build", () => {
    expect(pendingChanges(log(NIGHTLY, [R144]), seen("1.44.9.882", "1.44.9.882", ["aaaaaaaa"]))).toBeNull();
  });

  it("shows nothing for the fresh-install seed, whose lines are not recorded yet", () => {
    expect(pendingChanges(log(NIGHTLY, [R144]), seen("1.44.9.882", "1.44.9.882", null))).toBeNull();
  });

  describe("the first build with the feature", () => {
    it("shows a release build its own section", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.0.873", null, null));
      expect(pending).toEqual({ sections: [R144], crossed: [], unreleased: null, older: false });
    });

    it("shows a Nightly every Unreleased line", () => {
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", null, null));
      expect(pending).toEqual({ sections: [], crossed: [], unreleased: NIGHTLY, older: false });
    });

    it("shows a Nightly with no Unreleased line nothing", () => {
      expect(pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.9.882", null, null))).toBeNull();
    });
  });

  describe("a Stable user", () => {
    it("sees every release skipped as a section of its own", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143, R132]), seen("1.44.0.873", "1.32.0.763"));
      expect(pending).toEqual({ sections: [R144, R143], crossed: [], unreleased: null, older: false });
    });

    it("sees the one release since the last Stable", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R132], "1.0.0"), seen("1.44.0.873", "1.32.0.763"));
      expect(pending).toEqual({ sections: [R144], crossed: [], unreleased: null, older: false });
    });

    it("reads a mark on the newest release left out as a Stable", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.0.873", "1.32.0.763"));
      expect(pending).toEqual({ sections: [R144, R143], crossed: [], unreleased: null, older: false });
    });

    /** Intended: a mark older than every release the build knows names no channel, so the build's own one decides. */
    it("sees every bundled release as a section and learns that more lies beyond them", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.0.873", "1.0.0.500"));
      expect(pending).toEqual({ sections: [R144, R143], crossed: [], unreleased: null, older: true });
    });

    it("is not told about older releases alone", () => {
      expect(pendingChanges(log(unreleased(), [], "1.32.0"), seen("1.32.5.800", "1.0.0.500"))).toBeNull();
    });
  });

  describe("a Nightly user", () => {
    const recorded = ["aaaaaaaa", "cccccccc", "eeeeeeee"];

    it("sees only the lines not seen before, without the groups they emptied", () => {
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.44.8.881", recorded));
      expect(pending).toEqual({
        sections: [],
        crossed: [],
        unreleased: unreleased(group("added", "bbbbbbbb"), group("changed", "dddddddd")),
        older: false,
      });
    });

    it("sees nothing when every line was seen", () => {
      const all = linesToRecord(log(NIGHTLY, []));
      expect(pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.44.8.881", all))).toBeNull();
    });

    it("sees a Stable it crossed as a note beside the unseen lines", () => {
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.43.10.872", recorded));
      expect(pending).toEqual({
        sections: [],
        crossed: [R144],
        unreleased: unreleased(group("added", "bbbbbbbb"), group("changed", "dddddddd")),
        older: false,
      });
    });

    it("sees a crossed Stable even with no new line", () => {
      const all = linesToRecord(log(NIGHTLY, []));
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.43.10.872", all));
      expect(pending).toEqual({ sections: [], crossed: [R144], unreleased: null, older: false });
    });

    it("sees the bundled releases as notes when its mark is older than all of them", () => {
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.0.0.500"));
      expect(pending).toEqual({ sections: [], crossed: [R144, R143], unreleased: NIGHTLY, older: true });
    });

    it("stays in Nightly mode when it lands on the tag build itself", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.0.873", "1.43.10.872", recorded));
      expect(pending).toEqual({ sections: [], crossed: [R144], unreleased: null, older: false });
    });

    it("shows a Stable-channel user the release in full, even when the mark is a Nightly's", () => {
      const pending = pendingChanges(log(unreleased(), [R144, R143], "1.32.0"), seen("1.44.0.873", "1.43.10.872", recorded, "stable"));
      expect(pending).toEqual({ sections: [R144], crossed: [], unreleased: null, older: false });
    });

    it("keeps a Nightly build in Nightly mode on the Stable channel", () => {
      const pending = pendingChanges(log(NIGHTLY, [R144, R143], "1.32.0"), seen("1.44.9.882", "1.43.10.872", [], "stable"));
      expect(pending?.crossed).toEqual([R144]);
      expect(pending?.sections).toEqual([]);
    });

    /** Intended: a line's id hashes its wording, so a reworded line is a new line and shows again. */
    it("sees a reworded line again", () => {
      const reworded = unreleased(group("fixed", "cccccccc", "ffffffff"));
      const pending = pendingChanges(log(reworded, [R144]), seen("1.44.9.882", "1.44.8.881", ["cccccccc", "99999999"]));
      expect(pending).toEqual({ sections: [], crossed: [], unreleased: unreleased(group("fixed", "ffffffff")), older: false });
    });
  });

  it("keeps the Unreleased intro only while a line remains", () => {
    const withIntro: ChangeSection = { ...NIGHTLY, intro: [[{ type: "text", text: "Note." }]] };
    const shown = pendingChanges(log(withIntro, [R144]), seen("1.44.9.882", "1.44.8.881", ["aaaaaaaa"]));
    expect(shown?.unreleased?.intro).toEqual(withIntro.intro);
    const all = linesToRecord(log(NIGHTLY, []));
    expect(pendingChanges(log(withIntro, [R144]), seen("1.44.9.882", "1.44.8.881", all))).toBeNull();
  });

  it("does not change the changelog it reads", () => {
    const changelog = log(NIGHTLY, [R144, R143], "1.32.0");
    const before = structuredClone(changelog);
    pendingChanges(changelog, seen("1.44.9.882", "1.43.10.872", ["aaaaaaaa", "cccccccc"]));
    expect(changelog).toEqual(before);
  });
});
