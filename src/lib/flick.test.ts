import { describe, expect, it } from "vitest";
import { FLICK_PX, FLICK_SPEED, isFlick, releaseVelocity } from "@/lib/flick";

describe("releaseVelocity", () => {
  it("reads the speed over the last moments only, so an early pause does not slow a fast finish", () => {
    const samples = [
      { y: 0, t: 0 },
      { y: 2, t: 400 },
      { y: 22, t: 450 },
      { y: 42, t: 500 },
    ];
    expect(releaseVelocity(samples)).toBe(400);
  });

  it("is zero for no samples, one sample, or no time passed", () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ y: 5, t: 10 }])).toBe(0);
    expect(releaseVelocity([{ y: 5, t: 10 }, { y: 50, t: 10 }])).toBe(0);
  });

  it("reads an upward release as negative, which never dismisses", () => {
    const up = releaseVelocity([{ y: 100, t: 0 }, { y: 0, t: 50 }]);
    expect(up).toBeLessThan(0);
    expect(isFlick(-100, up)).toBe(false);
  });
});

describe("isFlick", () => {
  it("dismisses past the distance or past the speed, and not at either edge", () => {
    expect(isFlick(FLICK_PX + 1, 0)).toBe(true);
    expect(isFlick(0, FLICK_SPEED + 1)).toBe(true);
    expect(isFlick(FLICK_PX, FLICK_SPEED)).toBe(false);
  });
});
