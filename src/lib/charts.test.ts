import { describe, expect, it } from "vitest";
import { arcPath, polar, slices } from "./charts";

describe("polar", () => {
  it("starts at twelve o'clock and runs clockwise", () => {
    const top = polar(0, 0, 10, 0);
    expect(top.x).toBeCloseTo(0);
    expect(top.y).toBeCloseTo(-10);
    const right = polar(0, 0, 10, 90);
    expect(right.x).toBeCloseTo(10);
    expect(right.y).toBeCloseTo(0);
  });
});

describe("slices", () => {
  it("divides the turn in proportion", () => {
    const [a, b] = slices([3, 1]);
    expect(a.start).toBe(0);
    expect(a.end).toBeCloseTo(270);
    expect(b.end).toBeCloseTo(360);
  });

  it("collapses to nothing when every value is zero", () => {
    expect(slices([0, 0])).toEqual([
      { start: 0, end: 0 },
      { start: 0, end: 0 },
    ]);
  });
});

describe("arcPath", () => {
  it("draws a wedge with both radii", () => {
    const d = arcPath(50, 50, 20, 40, 0, 90);
    expect(d).toMatch(/^M/);
    expect(d).toContain("A40,40");
    expect(d).toContain("A20,20");
  });

  it("flags the long way round past a half turn", () => {
    expect(arcPath(0, 0, 5, 10, 0, 200)).toContain("0 1 1");
    expect(arcPath(0, 0, 5, 10, 0, 100)).toContain("0 0 1");
  });

  it("draws a full ring as two arcs", () => {
    // One arc back to its own start point renders nothing, so a category holding everything would disappear.
    const d = arcPath(0, 0, 5, 10, 0, 360);
    expect(d.match(/A10,10/g)?.length).toBe(2);
    expect(d.match(/A5,5/g)?.length).toBe(2);
  });
});

