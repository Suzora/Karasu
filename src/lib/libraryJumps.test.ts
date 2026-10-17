import { describe, expect, it } from "vitest";
import { libraryJumps } from "./libraryJumps";

/** The library column's jump marks: one per section that holds anything, in the page's order. */
describe("libraryJumps", () => {
  it("lists the sections that hold rows, in reading order, with their counts", () => {
    expect(libraryJumps({ ready: 11, done: 1, offList: 0, unplaced: 2 })).toEqual([
      { id: "ready", count: 11 },
      { id: "done", count: 1 },
      { id: "unplaced", count: 2 },
    ]);
  });

  it("offers nothing for an empty library", () => {
    expect(libraryJumps({ ready: 0, done: 0, offList: 0, unplaced: 0 })).toEqual([]);
  });
});
