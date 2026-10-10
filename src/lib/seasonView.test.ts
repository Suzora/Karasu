import { describe, expect, it } from "vitest";
import { parsePeriod, writePeriod, type Period } from "./seasonView";

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
