import { describe, expect, it } from "vitest";
import {
  MEDIA_SECTIONS,
  birthdayDay,
  browseVariables,
  rowRequestSize,
  sectionOfView,
  sectionPeriod,
  showAllView,
} from "./browseSections";
import { SEARCH_DEFAULTS, parseSearchView, writeSearchView } from "./searchView";
import type { Period } from "./seasonView";

const QUERIES = import.meta.glob("/src/api/queries.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const queries = Object.values(QUERIES)[0];

const FALL: Period = { season: "FALL", year: 2026 };

describe("browse sections", () => {
  /** A section the table names but the query lacks would draw an empty row forever. */
  it("asks the browse query for every section it draws, and for nothing else", () => {
    for (const [type, name] of [["ANIME", "ANIME_BROWSE_QUERY"], ["MANGA", "MANGA_BROWSE_QUERY"]] as const) {
      const body = queries.split(`const ${name} = \``)[1]?.split("`;")[0] ?? "";
      const aliases = [...body.matchAll(/^\s*(\w+): Page\(/gm)].map((m) => m[1]);
      expect(aliases).toEqual([...MEDIA_SECTIONS[type]]);
    }
  });

  it("asks a row for what the setting draws plus a few, between twelve and AniList's page cap", () => {
    expect(rowRequestSize(4)).toBe(12);
    expect(rowRequestSize(8)).toBe(12);
    expect(rowRequestSize(10)).toBe(14);
    expect(rowRequestSize(40)).toBe(44);
    expect(rowRequestSize(60)).toBe(50);
  });

  it("names this season and the next for anime, across a year's end, and no season for manga", () => {
    expect(browseVariables("ANIME", FALL, 12)).toEqual({ perPage: 12, season: "FALL", year: 2026, nextSeason: "WINTER", nextYear: 2027 });
    expect(browseVariables("MANGA", FALL, 12)).toEqual({ perPage: 12 });
  });

  it("dates only the two season sections", () => {
    expect(sectionPeriod("season", FALL)).toEqual(FALL);
    expect(sectionPeriod("nextSeason", FALL)).toEqual({ season: "WINTER", year: 2027 });
    expect(sectionPeriod("trending", FALL)).toBeNull();
    expect(sectionPeriod("top", FALL)).toBeNull();
  });

  describe("Show all", () => {
    it("opens the grid with the section's own sort and filters", () => {
      expect(showAllView("ANIME", "trending", FALL)).toEqual({ ...SEARCH_DEFAULTS, sort: "TRENDING_DESC" });
      expect(showAllView("ANIME", "nextSeason", FALL)).toEqual({ ...SEARCH_DEFAULTS, sort: "POPULARITY_DESC", season: "WINTER", year: "2027" });
      expect(showAllView("MANGA", "manhwa", FALL)).toEqual({ ...SEARCH_DEFAULTS, scope: "MANGA", sort: "POPULARITY_DESC", country: "KR" });
      expect(showAllView("MANGA", "top", FALL)).toEqual({ ...SEARCH_DEFAULTS, scope: "MANGA", sort: "SCORE_DESC" });
    });

    /** The view goes into the URL, and a value the parser drops would land Back on a different grid. */
    it("writes a view the URL brings back whole", () => {
      for (const type of ["ANIME", "MANGA"] as const) {
        for (const key of MEDIA_SECTIONS[type]) {
          const v = showAllView(type, key, FALL);
          expect(parseSearchView(writeSearchView(new URLSearchParams(), v))).toEqual(v);
        }
      }
    });

    it("never opens the empty view, which shows the sections again", () => {
      const bare = writeSearchView(new URLSearchParams(), SEARCH_DEFAULTS).toString();
      for (const type of ["ANIME", "MANGA"] as const) {
        for (const key of MEDIA_SECTIONS[type]) {
          expect(writeSearchView(new URLSearchParams(), { ...showAllView(type, key, FALL), scope: "ANIME" }).toString()).not.toBe(bare);
        }
      }
    });

    it("is recognised as its section, and stops being one once refined", () => {
      for (const type of ["ANIME", "MANGA"] as const) {
        for (const key of MEDIA_SECTIONS[type]) expect(sectionOfView(showAllView(type, key, FALL), FALL)).toBe(key);
      }
      expect(sectionOfView({ ...showAllView("ANIME", "trending", FALL), term: "frieren" }, FALL)).toBeNull();
      expect(sectionOfView({ ...showAllView("ANIME", "top", FALL), genre: { include: ["Drama"], exclude: [] } }, FALL)).toBeNull();
      expect(sectionOfView(SEARCH_DEFAULTS, FALL)).toBeNull();
      expect(sectionOfView({ ...SEARCH_DEFAULTS, scope: "STAFF" }, FALL)).toBeNull();
    });

    it("stops naming last season's section once the season has turned", () => {
      const view = showAllView("ANIME", "season", { season: "SUMMER", year: 2026 });
      expect(sectionOfView(view, FALL)).toBeNull();
    });

    it("reads a cleared season filter on a season section as all-time popular, which it then is", () => {
      expect(sectionOfView({ ...showAllView("ANIME", "season", FALL), season: "", year: "" }, FALL)).toBe("popular");
    });
  });

  it("keys birthdays by AniList's UTC day, not the local one", () => {
    expect(birthdayDay(new Date("2026-10-16T23:30:00Z"))).toBe("2026-10-16");
    expect(birthdayDay(new Date("2026-10-17T00:30:00Z"))).toBe("2026-10-17");
  });
});
