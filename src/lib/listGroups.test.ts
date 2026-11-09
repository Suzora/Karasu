import { describe, expect, it } from "vitest";
import { groupEntries, groupRows, rowOfEntry } from "./listGroups";

const e = (id: number, keys: string[]) => ({ id, keys });
const keysOf = (x: { keys: string[] }) => x.keys;

describe("groupEntries", () => {
  it("puts an entry in every group it names, in the given order, and the rest last", () => {
    const groups = groupEntries([e(1, ["b"]), e(2, ["a", "b"]), e(3, [])], keysOf, ["a", "b", "c"]);
    expect(groups.map((g) => [g.key, g.entries.map((x) => x.id)])).toEqual([
      ["a", [2]],
      ["b", [1, 2]],
      ["", [3]],
    ]);
  });

  it("leaves out a group nothing falls into, and keeps keys the order does not know", () => {
    const groups = groupEntries([e(1, ["z"])], keysOf, ["a"]);
    expect(groups.map((g) => g.key)).toEqual(["z"]);
  });
});

describe("groupRows", () => {
  const groups = groupEntries([e(1, ["a"]), e(2, ["a"]), e(3, ["a"]), e(4, ["b"])], keysOf, ["a", "b"]);

  it("chunks each open group by the column count under its head", () => {
    const rows = groupRows(groups, new Set(), 2);
    expect(rows.map((r) => (r.kind === "head" ? `h:${r.group.key}` : `c:${r.first}:${r.entries.length}`))).toEqual([
      "h:a",
      "c:0:2",
      "c:2:1",
      "h:b",
      "c:3:1",
    ]);
  });

  it("draws a folded group as its head alone, and the flat index skips it", () => {
    const rows = groupRows(groups, new Set(["a"]), 2);
    expect(rows.map((r) => (r.kind === "head" ? `h:${r.group.key}:${r.open}` : `c:${r.first}`))).toEqual([
      "h:a:false",
      "h:b:true",
      "c:0",
    ]);
  });

  it("finds the row an entry index sits in", () => {
    const rows = groupRows(groups, new Set(), 2);
    expect(rowOfEntry(rows, 0)).toBe(1);
    expect(rowOfEntry(rows, 2)).toBe(2);
    expect(rowOfEntry(rows, 3)).toBe(4);
    expect(rowOfEntry(rows, 9)).toBeNull();
  });
});
