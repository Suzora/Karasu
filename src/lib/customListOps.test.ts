import { describe, expect, it } from "vitest";
import type { MediaListGroup } from "@/api/types";
import { entry, media } from "@/test/fixtures";
import {
  drift,
  hiddenOrphans,
  isSingleEdit,
  memberCount,
  planOp,
  snapshot,
  validateName,
  type ListOp,
  type ListShape,
} from "./customListOps";

const SECTIONS = ["Watching", "Rewatching", "Completed", "Paused", "Dropped", "Planning"];

const shape = (customLists: string[], extraOrder: string[] = []): ListShape => ({
  customLists,
  sectionOrder: [...SECTIONS, ...extraOrder],
});

const member = (id: number, lists: Record<string, boolean>, hidden = false) =>
  entry({ id, media: media({ id: 1000 + id }), customLists: lists, hiddenFromStatusLists: hidden });

const groups = (...entries: ReturnType<typeof member>[]): MediaListGroup[] => [
  { name: "Watching", status: "CURRENT", isCustomList: false, entries },
];

describe("validateName", () => {
  const s = shape(["Ghibli", "Seasonals — Airing"]);

  it("refuses an empty or blank name", () => {
    expect(validateName("", s)).toBe("empty");
    expect(validateName("   ", s)).toBe("empty");
  });

  it("refuses a name another list has, ignoring case and edges", () => {
    expect(validateName("ghibli", s)).toBe("duplicate");
    expect(validateName("  GHIBLI ", s)).toBe("duplicate");
  });

  it("lets a rename change its own list's case", () => {
    expect(validateName("GHIBLI", s, "Ghibli")).toBeNull();
    expect(validateName("Seasonals — airing", s, "Ghibli")).toBe("duplicate");
  });

  it("refuses a status section's name, read from the account's own section order", () => {
    expect(validateName("completed", s)).toBe("reserved");
    expect(validateName("Planning", s)).toBe("reserved");
  });

  it("does not take a custom list in the section order for a status section", () => {
    const ordered = shape(["Ghibli"], ["Ghibli"]);
    expect(validateName("Ghibli", ordered, "Ghibli")).toBeNull();
  });

  it("accepts free text, punctuation and all", () => {
    expect(validateName("Long Time Ago / No rating", s)).toBeNull();
  });
});

describe("planOp", () => {
  it("appends a new list and leaves the section order alone", () => {
    expect(planOp({ kind: "create", name: "Ghibli" }, shape(["A", "B"]))).toEqual({ customLists: ["A", "B", "Ghibli"] });
  });

  it("renames in place, and in the section order only where the account placed it", () => {
    expect(planOp({ kind: "rename", from: "A", to: "Z" }, shape(["A", "B"]))).toEqual({ customLists: ["Z", "B"] });
    expect(planOp({ kind: "rename", from: "B", to: "Z" }, shape(["A", "B"], ["B"]))).toEqual({
      customLists: ["A", "Z"],
      sectionOrder: [...SECTIONS, "Z"],
    });
  });

  it("deletes exactly one list, and its section-order slot if it has one", () => {
    expect(planOp({ kind: "delete", name: "A" }, shape(["A", "B", "C"]))).toEqual({ customLists: ["B", "C"] });
    expect(planOp({ kind: "delete", name: "B" }, shape(["A", "B"], ["B"]))).toEqual({
      customLists: ["A"],
      sectionOrder: SECTIONS,
    });
  });

  it("answers null when the account no longer matches the op", () => {
    expect(planOp({ kind: "create", name: "A" }, shape(["A"]))).toBeNull();
    expect(planOp({ kind: "rename", from: "gone", to: "Z" }, shape(["A"]))).toBeNull();
    expect(planOp({ kind: "rename", from: "A", to: "A" }, shape(["A"]))).toBeNull();
    expect(planOp({ kind: "rename", from: "A", to: "B" }, shape(["A", "B"]))).toBeNull();
    expect(planOp({ kind: "delete", name: "gone" }, shape(["A"]))).toBeNull();
  });

  it("never touches more than one position, whatever the op and the list", () => {
    const lists = ["A", "B", "C", "D"];
    const ops: ListOp[] = [
      { kind: "create", name: "E" },
      ...lists.map((l): ListOp => ({ kind: "rename", from: l, to: `${l}2` })),
      ...lists.map((l): ListOp => ({ kind: "delete", name: l })),
    ];
    for (const op of ops) {
      const write = planOp(op, shape(lists, ["C"]));
      expect(write, op.kind).not.toBeNull();
      expect(isSingleEdit(lists, write!.customLists), JSON.stringify(op)).toBe(true);
      if (write!.sectionOrder) expect(isSingleEdit([...SECTIONS, "C"], write!.sectionOrder)).toBe(true);
    }
  });
});

describe("isSingleEdit", () => {
  it("accepts one append, one replacement or one removal", () => {
    expect(isSingleEdit(["A", "B"], ["A", "B", "C"])).toBe(true);
    expect(isSingleEdit(["A", "B"], ["A", "X"])).toBe(true);
    expect(isSingleEdit(["A", "B", "C"], ["A", "C"])).toBe(true);
  });

  it("refuses a reorder, an insert in the middle, two changes or no change", () => {
    expect(isSingleEdit(["A", "B"], ["B", "A"])).toBe(false);
    expect(isSingleEdit(["A", "B"], ["A", "X", "B"])).toBe(false);
    expect(isSingleEdit(["A", "B", "C"], ["X", "B", "Y"])).toBe(false);
    expect(isSingleEdit(["A", "B", "C"], ["C"])).toBe(false);
    expect(isSingleEdit(["A", "B"], ["A", "B"])).toBe(false);
  });
});

describe("membership", () => {
  it("reads the true keys once per entry, however many groups show it", () => {
    const e = member(1, { Ghibli: true, Other: false });
    const m = snapshot([...groups(e), { name: "Ghibli", status: null, isCustomList: true, entries: [e] }]);
    expect(m.size).toBe(1);
    expect(m.get(1)?.lists).toEqual(["Ghibli"]);
  });

  it("counts members and finds the hidden entries a delete would strand", () => {
    const m = snapshot(
      groups(
        member(1, { A: true }),
        member(2, { A: true, B: true }, true),
        member(3, { A: true }, true),
        member(4, { B: true }, true),
      ),
    );
    expect(memberCount(m, "A")).toBe(3);
    expect(hiddenOrphans(m, "A").map((o) => o.id)).toEqual([3]);
    expect(hiddenOrphans(m, "B").map((o) => o.id)).toEqual([4]);
  });
});

describe("drift", () => {
  const before = snapshot(groups(member(1, { A: true, B: true }), member(2, { B: true }), member(3, {})));

  it("finds nothing when a rename carried every member across", () => {
    const after = snapshot(groups(member(1, { Z: true, B: true }), member(2, { B: true }), member(3, {})));
    expect(drift({ kind: "rename", from: "A", to: "Z" }, before, after)).toEqual([]);
  });

  it("repairs a rename that dropped its members, with each entry's whole membership", () => {
    const after = snapshot(groups(member(1, { B: true, Z: false }), member(2, { B: true }), member(3, {})));
    expect(drift({ kind: "rename", from: "A", to: "Z" }, before, after)).toEqual([{ mediaId: 1001, lists: ["B", "Z"] }]);
  });

  it("repairs a delete that moved another list's contents, the bug AniList's forum reports", () => {
    const after = snapshot(groups(member(1, {}), member(2, { B: true }), member(3, { B: true })));
    expect(drift({ kind: "delete", name: "A" }, before, after)).toEqual([
      { mediaId: 1001, lists: ["B"] },
      { mediaId: 1003, lists: [] },
    ]);
  });

  it("puts back a hidden entry that left the read because it lost every list", () => {
    const was = snapshot(groups(member(1, { A: true }, true), member(2, {}, true)));
    const now = snapshot(groups());
    expect(drift({ kind: "rename", from: "A", to: "Z" }, was, now)).toEqual([{ mediaId: 1001, lists: ["Z"] }]);
    // A hidden entry the delete itself leaves on no list is the unhide's business, not a repair.
    expect(drift({ kind: "delete", name: "A" }, was, now)).toEqual([]);
  });

  it("skips an entry deleted meanwhile and one that appeared meanwhile", () => {
    const after = snapshot(groups(member(1, { B: true }), member(9, { B: true })));
    expect(drift({ kind: "delete", name: "A" }, before, after)).toEqual([]);
  });
});
