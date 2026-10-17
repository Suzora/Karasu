import { describe, expect, it } from "vitest";
import { parsePeriod, parseSeasonFilters, seasonOf, seasonSections, shiftSeason, writePeriod, writeSeasonFilters, yearStep, type Period } from "./seasonView";

const NOW: Period = { season: "FALL", year: 2026 };

describe("season in the URL", () => {
  it("reads the season it names", () => {
    expect(parsePeriod(new URLSearchParams("season=SPRING&year=2019"), NOW)).toEqual({ season: "SPRING", year: 2019 });
  });

  it("falls back to now when it names none or a malformed one", () => {
    expect(parsePeriod(new URLSearchParams(""), NOW)).toEqual(NOW);
    expect(parsePeriod(new URLSearchParams("season=MONSOON&year=2019"), NOW)).toEqual(NOW);
    expect(parsePeriod(new URLSearchParams("season=SPRING&year=19"), NOW)).toEqual(NOW);
  });

  it("names a season in full unless it is the current one", () => {
    const summer: Period = { season: "SUMMER", year: 2025 };
    expect(writePeriod(new URLSearchParams(), summer, NOW).toString()).toBe("season=SUMMER&year=2025");
    expect(writePeriod(new URLSearchParams("other=1"), summer, NOW).toString()).toBe("other=1&season=SUMMER&year=2025");
    // The same season a year earlier, and another season this year, are both not now.
    expect(writePeriod(new URLSearchParams(), { season: "FALL", year: 2025 }, NOW).toString()).toBe(
      "season=FALL&year=2025",
    );
    expect(writePeriod(new URLSearchParams(), { season: "WINTER", year: 2026 }, NOW).toString()).toBe(
      "season=WINTER&year=2026",
    );
  });

  it("leaves the URL bare for the current season, and keeps every other parameter", () => {
    expect(writePeriod(new URLSearchParams(), NOW, NOW).toString()).toBe("");
    expect(writePeriod(new URLSearchParams("season=SUMMER&year=2025&other=1"), NOW, NOW).toString()).toBe("other=1");
  });
});

describe("season arithmetic", () => {
  it("puts each month in its season, on the local calendar", () => {
    const at = (month: number) => seasonOf(new Date(2026, month, 15));
    expect([0, 2, 3, 5, 6, 8, 9, 11].map((m) => at(m).season)).toEqual([
      "WINTER", "WINTER", "SPRING", "SPRING", "SUMMER", "SUMMER", "FALL", "FALL",
    ]);
    expect(seasonOf(new Date(2026, 11, 31, 23, 59))).toEqual({ season: "FALL", year: 2026 });
    expect(seasonOf(new Date(2027, 0, 1, 0, 0))).toEqual({ season: "WINTER", year: 2027 });
  });

  it("steps across a year's end in both directions", () => {
    expect(shiftSeason({ season: "FALL", year: 2026 }, 1)).toEqual({ season: "WINTER", year: 2027 });
    expect(shiftSeason({ season: "WINTER", year: 2027 }, -1)).toEqual({ season: "FALL", year: 2026 });
    expect(shiftSeason({ season: "SPRING", year: 2026 }, 1)).toEqual({ season: "SUMMER", year: 2026 });
    expect(shiftSeason({ season: "SPRING", year: 2026 }, -1)).toEqual({ season: "WINTER", year: 2026 });
  });
});

describe("the season's filters in the URL", () => {
  it("reads a format, the unlisted switch and the score sort, and nothing for a bare URL", () => {
    expect(parseSeasonFilters(new URLSearchParams("format=MOVIE&unlisted=1&sort=score"))).toEqual({ format: "MOVIE", unlisted: true, byScore: true });
    expect(parseSeasonFilters(new URLSearchParams(""))).toEqual({ format: "", unlisted: false, byScore: false });
  });

  it("ignores a format AniList does not have", () => {
    expect(parseSeasonFilters(new URLSearchParams("format=NOVEL")).format).toBe("");
  });

  it("writes only what differs from the default and keeps the season", () => {
    const prev = new URLSearchParams("season=SPRING&year=2019&format=TV&unlisted=1");
    expect(writeSeasonFilters(prev, { format: "", unlisted: false, byScore: true }).toString()).toBe("season=SPRING&year=2019&sort=score");
  });
});

describe("yearStep", () => {
  it("keeps the season and moves the year", () => {
    expect(yearStep({ season: "SPRING", year: 2026 }, -1)).toEqual({ season: "SPRING", year: 2025 });
    expect(yearStep({ season: "FALL", year: 2026 }, 1)).toEqual({ season: "FALL", year: 2027 });
  });
});

describe("seasonSections", () => {
  const m = (id: number, format: string, averageScore: number | null, listed = false) =>
    ({ id, format, averageScore, mediaListEntry: listed ? { id, status: "PLANNING" } : null }) as { id: number; format: string; averageScore: number | null; mediaListEntry: unknown };
  const all = [m(1, "TV", 70), m(2, "MOVIE", 90), m(3, "TV", 85, true), m(4, "ONA", null)];

  it("groups by format in AniList's popularity order and counts every format", () => {
    const s = seasonSections(all, { format: "", unlisted: false, byScore: false });
    expect(s.groups.map((g) => [g.format, g.items.map((x) => x.id)])).toEqual([["TV", [1, 3]], ["MOVIE", [2]], ["ONA", [4]]]);
    expect(s.counts).toEqual({ TV: 2, MOVIE: 1, ONA: 1 });
    expect(s.total).toBe(4);
  });

  it("keeps one format, drops listed titles and sorts by score with unscored last", () => {
    expect(seasonSections(all, { format: "TV", unlisted: false, byScore: false }).groups.map((g) => g.format)).toEqual(["TV"]);
    expect(seasonSections(all, { format: "", unlisted: true, byScore: false }).groups[0].items.map((x) => x.id)).toEqual([1]);
    const sorted = seasonSections([m(1, "TV", 70), m(5, "TV", null), m(3, "TV", 85)], { format: "", unlisted: false, byScore: true });
    expect(sorted.groups[0].items.map((x) => x.id)).toEqual([3, 1, 5]);
  });

  it("counts formats before the filters, so the column's numbers do not move under a click", () => {
    expect(seasonSections(all, { format: "MOVIE", unlisted: true, byScore: false }).counts).toEqual({ TV: 2, MOVIE: 1, ONA: 1 });
  });
});
