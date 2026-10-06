import { describe, expect, it } from "vitest";
import { affinity, affinityGap, affinityPct, AFFINITY_MIN_SHARED } from "./affinity";

const list = (pairs: [number, number][]) => pairs.map(([mediaId, raw]) => ({ mediaId, raw }));

describe("affinity", () => {
  it("counts shared titles whether or not both sides scored them", () => {
    const out = affinity(
      list([[1, 80], [2, 0], [3, 60]]),
      list([[1, 70], [2, 50], [4, 90]]),
    );
    expect(out.shared).toBe(2); // 1 and 2
    expect(out.scoredShared).toBe(1); // only 1 has scores on both sides
  });

  it("perfect agreement is +1, perfect opposition is -1", () => {
    const ids = Array.from({ length: AFFINITY_MIN_SHARED }, (_, i) => i + 1);
    const mine = list(ids.map((id) => [id, id * 9]));
    expect(affinity(mine, mine).pearson).toBeCloseTo(1, 5);
    const inverted = list(ids.map((id) => [id, 100 - id * 9]));
    expect(affinity(mine, inverted).pearson).toBeCloseTo(-1, 5);
  });

  it("needs the floor of shared scored titles before it claims anything", () => {
    const mine = list([[1, 80], [2, 60], [3, 40], [4, 20]]);
    const out = affinity(mine, mine);
    expect(out.scoredShared).toBe(4);
    expect(out.scoredShared).toBeLessThan(AFFINITY_MIN_SHARED);
    expect(out.pearson).toBeNull();
  });

  it("a constant scorer correlates with nothing — null, not NaN", () => {
    const ids = Array.from({ length: AFFINITY_MIN_SHARED }, (_, i) => i + 1);
    const mine = list(ids.map((id) => [id, 70]));
    const theirs = list(ids.map((id) => [id, id * 9]));
    expect(affinity(mine, theirs).pearson).toBeNull();
  });

  it("surfaces the biggest gaps first, skipping exact agreements", () => {
    const mine = list([[1, 50], [2, 50], [3, 50], [4, 50], [5, 50], [6, 50]]);
    const theirs = list([[1, 90], [2, 55], [3, 50], [4, 20], [5, 60], [6, 45]]);
    const out = affinity(mine, theirs, 2);
    expect(out.disagreements.map((d) => d.mediaId)).toEqual([1, 4]);
    expect(out.disagreements[0].diff).toBe(40);
  });

  it("duplicate media ids (custom-list echoes) count once", () => {
    const out = affinity(
      list([[1, 80]]),
      list([[1, 60], [1, 60]]),
    );
    expect(out.shared).toBe(1);
    expect(out.scoredShared).toBe(1);
  });
});

describe("affinityGap", () => {
  const ids = Array.from({ length: AFFINITY_MIN_SHARED }, (_, i) => i + 1);

  it("names the floor below enough shared scores, and the spread when one side scores all alike", () => {
    expect(affinityGap(affinity(list([[1, 70]]), list([[1, 80]])))).toBe("floor");
    const flat = affinity(list(ids.map((id) => [id, 70])), list(ids.map((id) => [id, id * 9])));
    expect(affinityGap(flat)).toBe("spread");
    expect(affinityGap(affinity(list(ids.map((id) => [id, id * 9])), list(ids.map((id) => [id, id * 9]))))).toBeNull();
  });

  it("writes a negative share with a real minus sign", () => {
    expect(affinityPct(-0.42)).toBe("\u221242");
    expect(affinityPct(0.5)).toBe("50");
  });
});
