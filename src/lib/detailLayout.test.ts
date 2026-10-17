import { describe, expect, it } from "vitest";
import { detailSections } from "./detailLayout";

/** Where each part of the detail page goes, so the page only draws the order this returns. */
describe("detailSections", () => {
  it("lays the phone out in the maintainer's order, one column", () => {
    expect(detailSections(true)).toEqual({
      side: [],
      main: ["description", "altTitles", "info", "tags", "episodes", "trailer", "statuses", "scores", "cast", "related", "trend", "reviews", "links"],
    });
  });

  it("keeps the progress, the facts and the links in the desktop's side column", () => {
    const { side, main } = detailSections(false);
    expect(side).toEqual(["info", "links"]);
    expect(main).toEqual(["description", "scores", "statuses", "related", "cast", "episodes", "trailer", "trend", "reviews", "altTitles", "tags"]);
  });

  it("draws every part exactly once on either shell", () => {
    for (const phone of [true, false]) {
      const { side, main } = detailSections(phone);
      const all = [...side, ...main];
      expect(new Set(all).size).toBe(all.length);
      expect(all).toHaveLength(13);
    }
  });
});
