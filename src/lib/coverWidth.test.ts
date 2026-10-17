import { describe, expect, it } from "vitest";
import { COVER_MIN_PX, coverWidth } from "./coverWidth";

/** One cover width for every grid: the setting's count across a full-width page, whatever the grid stands beside. */
describe("coverWidth", () => {
  it("splits a full-width page into the chosen count, gaps and gutters taken out", () => {
    // 1280 px of main, 32 px gutters each side, 16 px gaps between ten covers.
    expect(coverWidth(1280, 10, 32, 16)).toBe((1280 - 64 - 9 * 16) / 10);
  });

  it("never draws a cover narrower than the floor, on a narrow window or a high count", () => {
    expect(coverWidth(500, 12, 16, 12)).toBe(COVER_MIN_PX);
  });

  it("answers the floor before the main area has a width", () => {
    expect(coverWidth(0, 8, 32, 16)).toBe(COVER_MIN_PX);
  });
});
