import { describe, expect, it } from "vitest";
import { colourOf, parseTagColours, setColour, TAG_COLOURS } from "./tagColours";

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
