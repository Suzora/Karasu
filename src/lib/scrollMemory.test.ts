import { afterEach, describe, expect, it } from "vitest";
import {
  PLACE_LIMIT,
  forgetPlaces,
  offsetInRows,
  placeInRows,
  recallPlace,
  rememberPlace,
  restoreStep,
  rowOfPlace,
} from "./scrollMemory";

afterEach(forgetPlaces);

describe("scroll memory", () => {
  it("returns the last place remembered under a key", () => {
    rememberPlace("a:main", 120);
    rememberPlace("a:main", 480);
    expect(recallPlace("a:main")).toBe(480);
    expect(recallPlace("b:main")).toBeUndefined();
  });

  it("forgets the least recently written entry past its bound, never a fresh one", () => {
    for (let i = 0; i < PLACE_LIMIT; i++) rememberPlace(`k${i}`, i);
    // Rewritten, so it is the newest now and outlives the first eviction.
    rememberPlace("k0", 7);
    rememberPlace("extra", 1);
    expect(recallPlace("k0")).toBe(7);
    expect(recallPlace("k1")).toBeUndefined();
    expect(recallPlace("extra")).toBe(1);
  });
});

describe("restoreStep", () => {
  it("waits while the target cannot be known yet", () => {
    expect(restoreStep(0, null, 3)).toEqual({ scrollTo: null, stable: 0, done: false });
  });

  it("scrolls toward a target it has not reached, and starts counting again", () => {
    expect(restoreStep(0, 900, 1)).toEqual({ scrollTo: 900, stable: 0, done: false });
  });

  it("stops only once the target has held for two frames", () => {
    const first = restoreStep(900, 900, 0);
    expect(first).toEqual({ scrollTo: null, stable: 1, done: false });
    expect(restoreStep(900.4, 900, first.stable)).toEqual({ scrollTo: null, stable: 2, done: true });
  });
});

describe("a virtualized list's place", () => {
  const row = (index: number, size = 300) => ({ index, start: index * size, size });

  it("comes back to the same pixel at the same column count", () => {
    const place = placeInRows(3 * 300 + 120, row(3), 10);
    expect(place).toBeCloseTo(30.4);
    const { row: r, into } = rowOfPlace(place, 10);
    expect(r).toBe(3);
    expect(offsetInRows(r * 300, 300, into, 99_999)).toBeCloseTo(1020);
  });

  it("finds the row holding the same entry when the column count changed", () => {
    // Entry 30 sat in row 3 of a ten-column grid; one entry a row puts it in row 30.
    const { row: r } = rowOfPlace(placeInRows(900, row(3), 10), 1);
    expect(r).toBe(30);
    expect(rowOfPlace(placeInRows(900, row(3), 10), 4).row).toBe(7);
  });

  it("never reads a row as fully scrolled past, and reads nothing without a row", () => {
    expect(placeInRows(3 * 300 + 300, row(3), 1) - 3).toBeLessThan(1);
    expect(placeInRows(-50, row(0), 1)).toBe(0);
    expect(placeInRows(400, undefined, 10)).toBe(0);
    expect(placeInRows(0, { index: 2, start: 0, size: 0 }, 5)).toBe(10);
  });

  it("aims no further than the scroller can go, so a list that came back shorter still settles", () => {
    expect(offsetInRows(1200, 300, 0.5, 1000)).toBe(1000);
    expect(offsetInRows(1200, 300, 0.5, -20)).toBe(0);
  });
});

