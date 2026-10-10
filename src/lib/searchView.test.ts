import { describe, expect, it } from "vitest";
import { SEARCH_DEFAULTS, parseSearchView, writeSearchView, type SearchView } from "./searchView";

const view = (patch: Partial<SearchView>): SearchView => ({ ...SEARCH_DEFAULTS, ...patch });

describe("search view in the URL", () => {
  it("writes nothing for a fresh search, so the page keeps a bare URL", () => {
    expect(writeSearchView(new URLSearchParams(), SEARCH_DEFAULTS).toString()).toBe("");
  });

  it("brings back every part of a search it wrote", () => {
    const v = view({
      scope: "MANGA",
      term: "frieren",
      genre: { include: ["Drama", "Slice of Life"], exclude: ["Horror"] },
      tag: { include: ["Iyashikei"], exclude: [] },
      year: "2023",
      format: "NOVEL",
      status: "FINISHED",
      source: "LIGHT_NOVEL",
      country: "JP",
      sort: "SCORE_DESC",
    });
    expect(parseSearchView(writeSearchView(new URLSearchParams(), v))).toEqual(v);
  });

  it("keeps a genre or tag name with a comma whole", () => {
    const v = view({ tag: { include: ["Boys, Love"], exclude: ["A, B"] } });
    expect(parseSearchView(writeSearchView(new URLSearchParams(), v)).tag).toEqual(v.tag);
  });

  it("leaves the params it does not own alone", () => {
    const out = writeSearchView(new URLSearchParams("other=1&q=old"), view({ term: "new" }));
    expect(out.get("other")).toBe("1");
    expect(out.get("q")).toBe("new");
  });

  describe("writing a view again", () => {
    const steps: [string, Partial<SearchView>[]][] = [
      ["a term, then a genre, then a status", [{ term: "Frieren" }, { genre: { include: ["Fantasy"], exclude: [] } }, { status: "FINISHED" }]],
      ["a genre, then a sort", [{ genre: { include: ["Fantasy"], exclude: ["Horror"] } }, { sort: "SCORE_DESC" }]],
      ["a tag, then a year", [{ tag: { include: ["Iyashikei"], exclude: [] } }, { year: "2023" }]],
      ["a genre and a tag, then every single value", [
        { genre: { include: ["Drama"], exclude: [] } },
        { tag: { include: ["Time Skip"], exclude: ["Gore"] } },
        { scope: "MANGA", term: "x", format: "NOVEL", status: "FINISHED", source: "LIGHT_NOVEL", country: "JP", year: "2020", sort: "POPULARITY_DESC" },
      ]],
    ];

    it.each(steps)("is a fixpoint after %s", (_name, patches) => {
      let params = new URLSearchParams("other=1");
      let v = SEARCH_DEFAULTS;
      for (const patch of patches) {
        v = view({ ...v, ...patch });
        params = writeSearchView(params, v);
        expect(writeSearchView(params, v).toString()).toBe(params.toString());
        expect(parseSearchView(params)).toEqual(v);
      }
    });

    it("puts the keys it owns in one order whatever order they were picked in, behind the ones it does not", () => {
      const v = view({ term: "a", genre: { include: ["Drama"], exclude: [] }, status: "FINISHED" });
      const out = writeSearchView(new URLSearchParams("status=RELEASING&other=1&genre=Old&q=old"), v);
      expect(out.toString()).toBe("other=1&q=a&genre=Drama&status=FINISHED");
    });
  });

  it("drops each value a stale or hand-edited URL gets wrong, keeping the rest", () => {
    const v = parseSearchView(
      new URLSearchParams("scope=PLANETS&q=%20x%20&year=20x3&season=MONSOON&format=NOVEL&status=SOON&source=a-b&country=US&sort=RANDOM"),
    );
    expect(v).toEqual(view({ term: "x" }));
  });

  it("reads no season and no anime format for manga", () => {
    const v = parseSearchView(new URLSearchParams("scope=MANGA&season=FALL&format=TV"));
    expect(v.season).toBe("");
    expect(v.format).toBe("");
  });
});
