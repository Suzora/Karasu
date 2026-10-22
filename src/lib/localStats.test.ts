import { describe, expect, it } from "vitest";
import {
  activityHeatmap,
  completionMonths,
  completionPace,
  dayHeatmapFromHistory,
  genreDeltas,
  genreDrift,
  genreOutcomes,
  OTHER_GENRES,
  rewatchTotals,
  scorePairs,
  timeShare,
  weekdayTotals,
  historyDay,
  localTotals,
  scoreDelta,
  seasonalHistory,
} from "./localStats";
import type { MediaListEntry } from "@/api/types";

const entry = (
  mediaId: number,
  score: number,
  averageScore: number | null,
  title = `Show ${mediaId}`,
) =>
  ({
    id: mediaId,
    mediaId,
    score,
    media: {
      id: mediaId,
      title: { romaji: title, english: null, native: null },
      averageScore,
    },
  }) as unknown as MediaListEntry;

describe("scoreDelta", () => {
  it("compares on one scale: mine is ten-point, the community's is hundred-point", () => {
    const out = scoreDelta([entry(1, 8, 70)]);
    expect(out).not.toBeNull();
    expect(out!.meanMine).toBe(8);
    expect(out!.meanCommunity).toBe(7);
    expect(out!.meanDelta).toBe(1);
  });

  it("excludes the unscored and the unrated rather than counting them as zero", () => {
    const out = scoreDelta([
      entry(1, 8, 70),
      entry(2, 0, 80), // user never scored it
      entry(3, 7, null), // AniList has no mean
    ]);
    expect(out!.count).toBe(1);
  });

  it("returns null when nothing is comparable — a panel that draws from it can hide", () => {
    expect(scoreDelta([])).toBeNull();
    expect(scoreDelta([entry(1, 0, 70)])).toBeNull();
  });

  it("splits disagreements by direction, biggest first, capped at top", () => {
    const out = scoreDelta(
      [
        entry(1, 3, 80, "overrated-a"), // -5
        entry(2, 5, 80, "overrated-b"), // -3
        entry(3, 10, 60, "hidden-gem"), // +4
        entry(4, 8, 70, "slightly-up"), // +1
        entry(5, 7, 70, "agreed"), // 0
      ],
      1,
    );
    expect(out!.harshest.map((r) => r.title)).toEqual(["overrated-a"]);
    expect(out!.kindest.map((r) => r.title)).toEqual(["hidden-gem"]);
    // Zero-delta agreement appears on neither side.
    expect([...out!.harshest, ...out!.kindest].some((r) => r.delta === 0)).toBe(false);
  });

  it("counts each title once, however many custom lists repeat it", () => {
    const out = scoreDelta([entry(1, 8, 70), entry(1, 8, 70)]);
    expect(out!.count).toBe(1);
  });
});

const dated = (
  mediaId: number,
  startedAt: { year: number | null; month: number | null } | null,
  completedAt: { year: number | null; month: number | null } | null = null,
) =>
  ({
    id: mediaId,
    mediaId,
    score: 0,
    startedAt: startedAt ? { ...startedAt, day: null } : null,
    completedAt: completedAt ? { ...completedAt, day: null } : null,
    media: { id: mediaId, title: { romaji: "x", english: null, native: null } },
  }) as unknown as MediaListEntry;

describe("activityHeatmap", () => {
  it("puts each dated event in its month cell, starts and completions both", () => {
    const out = activityHeatmap([
      dated(1, { year: 2024, month: 3 }, { year: 2024, month: 5 }),
      dated(2, { year: 2024, month: 3 }),
    ]);
    expect(out).not.toBeNull();
    const y = out!.years.find((x) => x.year === 2024)!;
    expect(y.months[2]).toBe(2); // two March events
    expect(y.months[4]).toBe(1); // one May completion
    expect(out!.total).toBe(3);
    expect(out!.max).toBe(2);
  });

  it("skips a year-only date rather than pinning it to January", () => {
    // A fabricated cell reads exactly like a real one — the fuzzy-date rule.
    const out = activityHeatmap([
      dated(1, { year: 2019, month: null }),
      dated(2, { year: 2020, month: 6 }),
    ]);
    expect(out!.total).toBe(1);
    expect(out!.years.some((y) => y.year === 2019)).toBe(false);
  });

  it("keeps only the newest maxYears, oldest first", () => {
    const out = activityHeatmap(
      [
        dated(1, { year: 2019, month: 1 }),
        dated(2, { year: 2021, month: 1 }),
        dated(3, { year: 2023, month: 1 }),
      ],
      2,
    );
    expect(out!.years.map((y) => y.year)).toEqual([2021, 2023]);
  });

  it("has nothing to draw from an undated list", () => {
    expect(activityHeatmap([dated(1, null)])).toBeNull();
  });
});

describe("seasonalHistory", () => {
  const seasonal = (mediaId: number, season: string | null, score = 0) =>
    ({
      id: mediaId,
      mediaId,
      score,
      media: { id: mediaId, season, title: { romaji: "x", english: null, native: null } },
    }) as unknown as MediaListEntry;

  it("counts unique titles per season, in broadcast order", () => {
    const out = seasonalHistory([
      seasonal(1, "FALL"),
      seasonal(2, "WINTER"),
      seasonal(3, "FALL"),
      seasonal(3, "FALL"), // custom-list repeat
    ]);
    expect(out.map((s) => s.season)).toEqual(["WINTER", "FALL"]);
    expect(out.find((s) => s.season === "FALL")!.count).toBe(2);
  });

  it("averages only the scores that exist", () => {
    const out = seasonalHistory([
      seasonal(1, "SPRING", 8),
      seasonal(2, "SPRING", 0),
      seasonal(3, "SPRING", 6),
    ]);
    expect(out[0].meanScore).toBe(7);
  });

  it("leaves seasonless media outside the question", () => {
    expect(seasonalHistory([seasonal(1, null)])).toEqual([]);
  });
});

describe("localTotals", () => {
  const row = (over: Record<string, unknown> = {}) =>
    ({
      id: 1,
      mediaId: 1,
      status: "CURRENT",
      score: 0,
      progress: 0,
      media: { id: 1, seasonYear: null },
      ...over,
    }) as unknown as MediaListEntry;

  it("counts what AniList's endpoint would, from the list itself", () => {
    const out = localTotals([
      row({ mediaId: 1, status: "COMPLETED", score: 8, progress: 12 }),
      row({ mediaId: 2, status: "COMPLETED", score: 6, progress: 24 }),
      row({ mediaId: 3, status: "CURRENT", score: 0, progress: 3 }),
    ]);
    expect(out.count).toBe(3);
    expect(out.progressTotal).toBe(39);
    expect(out.scored).toBe(2);
    expect(out.meanScore).toBe(7);
    expect(out.byStatus).toContainEqual({ status: "COMPLETED", count: 2 });
    expect(out.byStatus).toContainEqual({ status: "CURRENT", count: 1 });
  });

  /** An unscored entry is an absence, not a zero; averaging it in drags the mean toward an opinion nobody holds. */
  it("leaves the unscored out of the mean and the distribution", () => {
    const out = localTotals([row({ score: 0 }), row({ mediaId: 2, score: 9 })]);
    expect(out.meanScore).toBe(9);
    expect(out.scoreCounts).toEqual([{ score: 9, count: 1 }]);
  });

  it("orders scores and years ascending, and skips media with no year", () => {
    const out = localTotals([
      row({ mediaId: 1, score: 9, media: { id: 1, seasonYear: 2021 } }),
      row({ mediaId: 2, score: 5, media: { id: 2, seasonYear: 2019 } }),
      row({ mediaId: 3, score: 9, media: { id: 3, seasonYear: null } }),
    ]);
    expect(out.scoreCounts).toEqual([
      { score: 5, count: 1 },
      { score: 9, count: 2 },
    ]);
    expect(out.releaseYears).toEqual([
      { year: 2019, count: 1 },
      { year: 2021, count: 1 },
    ]);
  });

  it("has an empty answer rather than a divide by zero", () => {
    const out = localTotals([]);
    expect(out.count).toBe(0);
    expect(out.meanScore).toBe(0);
    expect(out.byStatus).toEqual([]);
  });
});

describe("dayHeatmapFromHistory", () => {
  const day = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 1000);

  /** AniList's `date` is London midnight, UTC or UTC+1 by season; rounding recovers the day without a timezone. */
  it("reads both spellings of a day bucket as the same day", () => {
    expect(historyDay(day("2026-01-05"))).toBe(day("2026-01-05"));
    // 23:00Z on the 16th is London's 17th.
    expect(historyDay(day("2026-07-17") - 3600)).toBe(day("2026-07-17"));
  });

  it("returns null when there is nothing to draw", () => {
    expect(dayHeatmapFromHistory(null)).toBeNull();
    expect(dayHeatmapFromHistory([])).toBeNull();
    expect(dayHeatmapFromHistory([{ date: day("2026-01-05"), amount: 0 }])).toBeNull();
  });

  it("lays the days out in Monday-first weeks", () => {
    // 2026-01-05 is a Monday; 2026-01-11 the Sunday that closes that week.
    const grid = dayHeatmapFromHistory([
      { date: day("2026-01-05"), amount: 3, level: 3 },
      { date: day("2026-01-11"), amount: 1, level: 1 },
    ])!;

    expect(grid.weeks).toHaveLength(1);
    expect(grid.weeks[0]).toHaveLength(7);
    expect(grid.weeks[0][0]).toMatchObject({ amount: 3, level: 3 });
    expect(grid.weeks[0][6]).toMatchObject({ amount: 1, level: 1 });
    // A day inside the range with no activity is a cell, not a gap.
    expect(grid.weeks[0][3]).toMatchObject({ amount: 0, level: 0 });
    expect(grid.total).toBe(4);
  });

  /** A week that starts mid-range is padded, so every column is seven tall. */
  it("pads the days before the first one with nulls", () => {
    // 2026-01-07 is a Wednesday, so Mon and Tue lead with padding.
    const grid = dayHeatmapFromHistory([
      { date: day("2026-01-07"), amount: 2, level: 5 },
    ])!;
    expect(grid.weeks[0][0]).toBeNull();
    expect(grid.weeks[0][1]).toBeNull();
    expect(grid.weeks[0][2]).toMatchObject({ amount: 2 });
    expect(grid.weeks[0][3]).toBeNull();
  });

  it("labels each month once, at the column it starts in", () => {
    const grid = dayHeatmapFromHistory([
      { date: day("2026-01-26"), amount: 1, level: 1 },
      { date: day("2026-02-09"), amount: 1, level: 1 },
    ])!;
    const months = grid.months.map((m) => m.month);
    expect(months).toEqual([0, 1]);
    expect(new Set(grid.months.map((m) => m.column)).size).toBe(grid.months.length);
  });

  /** Two rows for one day is not a shape AniList has shown, so it is folded rather than trusted to be absent. */
  it("folds a repeated day instead of dropping one", () => {
    const grid = dayHeatmapFromHistory([
      { date: day("2026-01-05"), amount: 2, level: 1 },
      { date: day("2026-01-05"), amount: 3, level: 7 },
    ])!;
    expect(grid.weeks[0][0]).toMatchObject({ amount: 5, level: 7 });
    expect(grid.total).toBe(5);
  });
});

// --- The insight panels --------------------------------------------------------------

const rich = (
  mediaId: number,
  over: Partial<MediaListEntry> & { genres?: string[]; averageScore?: number | null; format?: string; duration?: number | null } = {},
) => {
  const { genres = ["Action"], averageScore = 70, format = "TV", duration = 24, ...entry } = over;
  return {
    id: mediaId,
    mediaId,
    status: "COMPLETED",
    score: 0,
    progress: 12,
    repeat: 0,
    startedAt: null,
    completedAt: null,
    ...entry,
    media: { id: mediaId, title: { romaji: `Show ${mediaId}`, english: null, native: null }, genres, averageScore, format, duration },
  } as unknown as MediaListEntry;
};
const day = (y: number, m: number, d: number) => ({ year: y, month: m, day: d });

describe("scorePairs", () => {
  it("puts both scores on the display scale and skips a title with either missing", () => {
    const pairs = scorePairs([rich(1, { score: 8, averageScore: 70 }), rich(2, { score: 0 }), rich(3, { score: 6, averageScore: null }), rich(1, { score: 2 })], 10);
    expect(pairs).toEqual([{ mediaId: 1, title: "Show 1", mine: 8, community: 7 }]);
  });
});

describe("genreDeltas", () => {
  it("is the mean of mine minus the community's per genre, kindest first, and drops a genre under the minimum", () => {
    const rows = genreDeltas(
      [
        rich(1, { score: 9, averageScore: 70, genres: ["Drama", "Comedy"] }),
        rich(2, { score: 8, averageScore: 70, genres: ["Drama"] }),
        rich(3, { score: 4, averageScore: 80, genres: ["Comedy"] }),
        rich(4, { score: 7, averageScore: 70, genres: ["Horror"] }),
      ],
      10,
      2,
    );
    expect(rows.map((r) => r.genre)).toEqual(["Drama", "Comedy"]);
    expect(rows[0].delta).toBeCloseTo(1.5);
    expect(rows[1].delta).toBeCloseTo(-1);
    expect(rows[1].count).toBe(2);
  });
});

describe("genreOutcomes", () => {
  it("counts started titles per status and leaves planned ones out", () => {
    const rows = genreOutcomes(
      [
        rich(1, { genres: ["Drama"] }),
        rich(2, { genres: ["Drama"], status: "DROPPED" }),
        rich(3, { genres: ["Drama"], status: "REPEATING" }),
        rich(4, { genres: ["Drama"], status: "PLANNING" }),
      ],
      2,
    );
    expect(rows).toEqual([{ genre: "Drama", total: 3, finished: 2 / 3, byStatus: { COMPLETED: 1, DROPPED: 1, REPEATING: 1 } }]);
  });
});

describe("genreDrift", () => {
  it("keeps the most frequent genres and folds the rest into the other band, per start year", () => {
    const drift = genreDrift(
      [
        rich(1, { genres: ["A", "B"], startedAt: day(2020, 1, 1) }),
        rich(2, { genres: ["A", "C"], startedAt: day(2021, 1, 1) }),
        rich(3, { genres: ["A"], startedAt: day(2022, 1, 1) }),
        rich(4, { genres: ["B"], completedAt: day(2022, 5, 1) }),
      ],
      2,
    );
    expect(drift?.years).toEqual([2020, 2021, 2022]);
    expect(drift?.keys).toEqual(["A", "B", OTHER_GENRES]);
    expect(drift?.rows[1]).toEqual({ A: 1, B: 0, [OTHER_GENRES]: 1 });
    expect(drift?.rows[2]).toEqual({ A: 1, B: 1, [OTHER_GENRES]: 0 });
  });

  it("answers null under three years, since a share over two points is not a trend", () => {
    expect(genreDrift([rich(1, { startedAt: day(2020, 1, 1) }), rich(2, { startedAt: day(2021, 1, 1) })])).toBeNull();
  });
});

describe("weekdayTotals", () => {
  it("sums AniList's history by weekday, Monday first", () => {
    // 2024-01-01 was a Monday; AniList stamps a London midnight, an hour before UTC in summer.
    const monday = Date.UTC(2024, 0, 1) / 1000;
    const sunday = Date.UTC(2024, 5, 30) / 1000 - 3600;
    expect(weekdayTotals([{ date: monday, amount: 3 }, { date: sunday, amount: 2 }, { date: monday, amount: 1 }])).toEqual([4, 0, 0, 0, 0, 0, 2]);
    expect(weekdayTotals([])).toBeNull();
  });
});

describe("completionMonths", () => {
  it("counts each title's completion month once and skips a date without a month", () => {
    const months = completionMonths([rich(1, { completedAt: day(2023, 4, 2) }), rich(1, { completedAt: day(2024, 4, 2) }), rich(2, { completedAt: { year: 2023, month: null, day: null } })]);
    expect(months?.[3]).toBe(1);
    expect(months?.reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe("completionPace", () => {
  it("gives the median and the middle half of the days from start to finish, per format, fastest first", () => {
    const tv = [1, 3, 5, 7, 9].map((d, i) => rich(10 + i, { startedAt: day(2024, 1, 1), completedAt: day(2024, 1, 1 + d) }));
    const movies = [0, 0, 0].map((_, i) => rich(20 + i, { format: "MOVIE", startedAt: day(2024, 2, 1), completedAt: day(2024, 2, 1) }));
    const rows = completionPace([...tv, ...movies, rich(30, { status: "CURRENT", startedAt: day(2024, 1, 1) })]);
    expect(rows.map((r) => r.format)).toEqual(["MOVIE", "TV"]);
    expect(rows[0]).toMatchObject({ count: 3, median: 1 });
    expect(rows[1]).toMatchObject({ count: 5, q1: 4, median: 6, q3: 8 });
  });
});

describe("timeShare", () => {
  it("weighs progress by runtime and counts every rewatch", () => {
    const share = timeShare([rich(1, { progress: 10, duration: 30, repeat: 1 }), rich(2, { progress: 12 }), rich(3, { progress: 1, duration: null })], 2);
    expect(share?.total).toBe(600 + 288 + 24);
    expect(share?.rows.map((r) => r.mediaId)).toEqual([1, 2]);
  });
});

describe("rewatchTotals", () => {
  it("sums the repeats, the titles with any, and names the one seen most", () => {
    expect(rewatchTotals([rich(1, { repeat: 2 }), rich(2, { repeat: 1 }), rich(3)])).toEqual({ repeats: 3, titles: 2, most: { title: "Show 1", times: 3 } });
  });
});
