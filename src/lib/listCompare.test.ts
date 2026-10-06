import { describe, expect, it } from "vitest";
import { compareLists, type CompareEntry } from "@/lib/listCompare";
import { toRaw } from "@/lib/scoreFormat";

const e = (mediaId: number, raw: number, status: CompareEntry["status"] = "COMPLETED"): CompareEntry => ({
  mediaId,
  raw,
  status,
});

describe("compareLists", () => {
  it("counts a title once even when a custom list repeats it", () => {
    const mine = [e(1, 80), e(1, 80), e(2, 60)];
    const theirs = [e(1, 70), e(1, 70), e(2, 50)];
    const c = compareLists(mine, theirs);
    expect(c.shared).toBe(2);
    expect(c.bothCompleted).toBe(2);
    expect(c.meanMine).toBe(70);
    expect(c.meanTheirs).toBe(60);
  });

  it("offers what they finished and scored that the viewer has not seen or only plans, best first", () => {
    const mine = [e(1, 0, "PLANNING"), e(2, 90), e(3, 0, "CURRENT")];
    const theirs = [e(1, 70), e(2, 80), e(3, 95), e(4, 90), e(5, 0), e(6, 85, "CURRENT"), e(7, 90)];
    expect(compareLists(mine, theirs).theyRatedUnseen).toEqual([
      { mediaId: 4, theirsRaw: 90 },
      { mediaId: 7, theirsRaw: 90 },
      { mediaId: 1, theirsRaw: 70 },
    ]);
    expect(compareLists(mine, theirs, { picks: 1 }).theyRatedUnseen).toHaveLength(1);
  });

  it("treats a rewatch as finished on either side", () => {
    expect(compareLists([e(1, 0, "REPEATING")], [e(1, 0, "COMPLETED")]).bothCompleted).toBe(1);
    expect(compareLists([e(1, 0, "PAUSED")], [e(1, 0, "COMPLETED")]).bothCompleted).toBe(0);
  });

  it("correlates two score formats once both are raw", () => {
    const mine = [3, 2, 1, 3, 2, 1, 3, 2, 1, 3].map((s, i) => e(i, toRaw("POINT_3", s)));
    const theirs = [95, 60, 30, 90, 55, 20, 85, 50, 25, 92].map((s, i) => e(i, toRaw("POINT_100", s)));
    expect(compareLists(mine, theirs).pearson).toBeGreaterThan(0.9);
  });

  it("answers an empty pair with zeros and nulls, never NaN", () => {
    const c = compareLists([], []);
    expect(c).toMatchObject({ shared: 0, scoredShared: 0, pearson: null, meanMine: null, meanTheirs: null, bothCompleted: 0 });
    expect(c.theyRatedUnseen).toEqual([]);
  });
});
