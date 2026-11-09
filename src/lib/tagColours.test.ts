import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { colourOf, isCustom, parseTagColours, readableDot, setColour, TAG_COLOURS } from "./tagColours";

describe("tag colours", () => {
  it("offers a fixed palette of eight", () => {
    expect(TAG_COLOURS).toHaveLength(8);
  });

  it("looks a tag up whatever its case", () => {
    const map = setColour({}, "Comfort", "rose");
    expect(colourOf(map, "comfort")).toBe("rose");
    expect(colourOf(map, "COMFORT")).toBe("rose");
    expect(colourOf(map, "family")).toBeNull();
  });

  it("clears a colour when none is chosen", () => {
    expect(setColour({ comfort: "rose" }, "Comfort", null)).toEqual({});
  });

  it("reads stored JSON and drops what the palette does not know", () => {
    expect(parseTagColours('{"comfort":"rose","x":"neon","y":3}')).toEqual({ comfort: "rose" });
    expect(parseTagColours("not json")).toEqual({});
    expect(parseTagColours(null)).toEqual({});
    expect(parseTagColours("[1,2]")).toEqual({});
  });
});

describe("custom tag colours", () => {
  it("keeps a valid hex beside the palette names and drops a malformed one", () => {
    expect(parseTagColours('{"a":"#FF8800","b":"#f80","c":"teal"}')).toEqual({ a: "#ff8800", c: "teal" });
    expect(isCustom("#ff8800")).toBe(true);
    expect(isCustom("teal")).toBe(false);
  });

  it("stores a picked hex lower-cased", () => {
    expect(setColour({}, "Comfort", "#AABBCC")).toEqual({ comfort: "#aabbcc" });
  });

  it("lifts a dot that would sink into the chip to 3:1, in both themes, and leaves a readable one alone", () => {
    const dark = "#1f232b";
    const light = "#e5e8ed";
    for (const hex of ["#000000", "#ffffff", "#20242c", "#e0e3e8", "#3355ff", "#ffcc00"]) {
      expect(contrastRatio(readableDot(hex, "dark"), dark), `dark ${hex}`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(readableDot(hex, "light"), light), `light ${hex}`).toBeGreaterThanOrEqual(3);
    }
    expect(readableDot("#f2788f", "dark")).toBe("#f2788f");
  });
});
