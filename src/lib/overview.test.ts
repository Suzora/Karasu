import { describe, expect, it } from "vitest";
import { entry, media } from "@/test/fixtures";
import {
  pagerIndex,
  stackTops,
  weekBounds,
  STRIP_SECS,
  TICK_LIMIT,
  WEEK_SECS,
  catchUp,
  comingUp,
  continueRow,
  greetingKey,
  overviewFigures,
  progressMarks,
  progressShare,
  shelfStatuses,
  spineHeight,
  stripItems,
  timetableSlot,
  weekLine,
} from "./overview";

/** Every decision the Overview makes, so its components only draw what these return. */

const NOW = 1_800_000_000;
const airing = (id: number, at: number, status: "CURRENT" | "REPEATING" | "PLANNING" | "PAUSED" = "CURRENT", episode = 5) =>
  entry({ id, status, media: media({ id, nextAiringEpisode: { episode, airingAt: at } }) });

describe("greetingKey", () => {
  it("says morning before eleven, day before six in the evening, evening after", () => {
    expect(greetingKey(10)).toBe("dashboard.greetMorning");
    expect(greetingKey(11)).toBe("dashboard.greetDay");
    expect(greetingKey(17)).toBe("dashboard.greetDay");
    expect(greetingKey(18)).toBe("dashboard.greetEvening");
  });

  it("has a nameless form for a profile without an account name", () => {
    expect(greetingKey(10, false)).toBe("dashboard.greetMorningPlain");
    expect(greetingKey(18, false)).toBe("dashboard.greetEveningPlain");
  });
});

describe("continueRow", () => {
  it("takes watching and rewatching from both lists, newest edit first, and leaves paused alone", () => {
    const a = entry({ id: 1, status: "CURRENT", updatedAt: 10 });
    const b = entry({ id: 2, status: "PAUSED", updatedAt: 99 });
    const c = entry({ id: 3, status: "REPEATING", updatedAt: 30, media: media({ id: 3, type: "MANGA" }) });
    expect(continueRow([a, b], [c]).map((r) => [r.entry.id, r.type])).toEqual([
      [3, "MANGA"],
      [1, "ANIME"],
    ]);
  });
});

describe("progressMarks and progressShare", () => {
  it("draws one tick per episode up to the limit, a bar past it or without a length", () => {
    expect(progressMarks(3, 12)).toEqual({ kind: "ticks", total: 12, done: 3 });
    expect(progressMarks(3, TICK_LIMIT)).toEqual({ kind: "ticks", total: TICK_LIMIT, done: 3 });
    expect(progressMarks(3, 41)).toEqual({ kind: "bar", share: 3 / 41 });
    expect(progressMarks(3, null)).toEqual({ kind: "bar", share: 0 });
  });

  it("never returns NaN and stays inside zero and one", () => {
    expect(progressShare(5, 0)).toBe(0);
    expect(progressShare(5, null)).toBe(0);
    expect(progressShare(15, 12)).toBe(1);
  });
});

describe("spineHeight and shelfStatuses", () => {
  it("varies a spine deterministically by id and position", () => {
    expect(spineHeight(1003, 2)).toBe(66 + ((1003 * 7 + 26) % 30));
    expect(spineHeight(1003, 2)).toBe(spineHeight(1003, 2));
  });

  it("orders the shelves as the lists are ordered", () => {
    expect(shelfStatuses()).toEqual(["CURRENT", "REPEATING", "PLANNING", "COMPLETED", "PAUSED", "DROPPED"]);
  });
});

describe("timetableSlot", () => {
  const starts = Array.from({ length: 8 }, (_, i) => NOW - 3600 + i * 86400);
  it("places an airing by its day and the share of that day gone", () => {
    expect(timetableSlot(starts[2] + 43200, starts)).toEqual({ day: 2, fraction: 0.5 });
  });

  it("returns null outside the seven days", () => {
    expect(timetableSlot(starts[7], starts)).toBeNull();
    expect(timetableSlot(starts[0] - 1, starts)).toBeNull();
  });
});

describe("catchUp", () => {
  const behind = (id: number, progress: number, episode: number, at = NOW + 3600, over: Partial<Parameters<typeof entry>[0]> = {}) =>
    entry({ id, progress, updatedAt: id, media: media({ id, episodes: 12, nextAiringEpisode: { episode, airingAt: at } }), ...over });

  it("counts the aired episodes not yet watched and names the next one", () => {
    expect(catchUp([behind(1, 3, 6)], NOW)).toEqual([expect.objectContaining({ aired: 5, behind: 2, next: 4 })]);
  });

  it("counts an episode whose airing time has passed, since the list can be older than the schedule", () => {
    expect(catchUp([behind(1, 3, 6, NOW - 60)], NOW)[0]).toMatchObject({ aired: 6, behind: 3 });
  });

  it("drops a title that is up to date, one with no schedule and one not being watched", () => {
    const upToDate = behind(1, 5, 6);
    const noSchedule = entry({ id: 2, progress: 1, media: media({ id: 2, episodes: 12, nextAiringEpisode: null }) });
    const planned = behind(3, 0, 6, NOW + 3600, { status: "PLANNING" });
    const paused = behind(4, 0, 6, NOW + 3600, { status: "PAUSED" });
    expect(catchUp([upToDate, noSchedule, planned, paused], NOW)).toEqual([]);
  });

  it("keeps a rewatch and lists the most recently touched title first", () => {
    const older = behind(1, 0, 3);
    const rewatch = behind(2, 0, 3, NOW + 3600, { status: "REPEATING" });
    expect(catchUp([older, rewatch], NOW).map((c) => c.entry.id)).toEqual([2, 1]);
  });

  it("never counts past the episodes the title has", () => {
    const short = entry({ id: 1, progress: 10, media: media({ id: 1, episodes: 12, nextAiringEpisode: { episode: 20, airingAt: NOW - 60 } }) });
    expect(catchUp([short], NOW)[0]).toMatchObject({ aired: 12, behind: 2 });
  });
});

describe("comingUp", () => {
  it("keeps what airs from the week's end on and planned titles, never what this week already shows", () => {
    const later = airing(1, NOW + WEEK_SECS + 1);
    const edge = airing(2, NOW + WEEK_SECS);
    const planned = airing(3, NOW + 3600, "PLANNING");
    const paused = airing(4, NOW + WEEK_SECS + 5, "PAUSED");
    expect(comingUp([later, edge, planned, paused], NOW).map((e) => e.id)).toEqual([3, 2, 1]);
    expect(weekLine([edge], NOW).count).toBe(0);
  });

  it("caps at the limit, soonest first", () => {
    const many = Array.from({ length: 9 }, (_, i) => airing(i + 10, NOW + WEEK_SECS + 100 * (9 - i)));
    const got = comingUp(many, NOW);
    expect(got).toHaveLength(6);
    expect(got[0].id).toBe(18);
  });
});

describe("stripItems", () => {
  it("places what airs within 48 hours by its offset, and nothing past it", () => {
    const soon = airing(1, NOW + 43200);
    const far = airing(2, NOW + STRIP_SECS + 1);
    expect(stripItems([soon, far], NOW)).toEqual([{ entry: soon, offset: 0.25 }]);
  });
});

describe("weekLine", () => {
  it("counts this week's episodes and names the soonest", () => {
    expect(weekLine([airing(1, NOW + 7200), airing(2, NOW + 3600), airing(3, NOW + WEEK_SECS + 10)], NOW)).toEqual({
      count: 2,
      nextAt: NOW + 3600,
    });
    expect(weekLine([], NOW)).toEqual({ count: 0, nextAt: null });
  });
});

describe("overviewFigures", () => {
  it("is all zeros and a null mean for empty lists, with no NaN", () => {
    const f = overviewFigures([], []);
    expect(f).toEqual({
      anime: 0,
      manga: 0,
      episodes: 0,
      chapters: 0,
      days: 0,
      meanScore: null,
      running: { anime: { done: 0, all: 0 }, manga: { done: 0, all: 0 } },
    });
  });

  it("counts each title once, minutes by duration, and the running share of watching titles with a length", () => {
    const a = entry({ id: 1, score: 8, progress: 4, media: media({ id: 1, episodes: 12, duration: 30 }) });
    const dup = entry({ id: 2, score: 8, progress: 4, media: media({ id: 1, episodes: 12, duration: 30 }) });
    const done = entry({ id: 3, status: "COMPLETED", score: 6, progress: 10, media: media({ id: 3, episodes: 10, duration: null }) });
    const m = entry({ id: 4, progress: 20, media: media({ id: 4, type: "MANGA", episodes: null, chapters: 100 }) });
    const f = overviewFigures([a, dup, done], [m]);
    expect(f.anime).toBe(2);
    expect(f.episodes).toBe(14);
    expect(f.days).toBeCloseTo((4 * 30 + 10 * 24) / 1440);
    expect(f.meanScore).toBe(7);
    expect(f.running.anime).toEqual({ done: 4, all: 12 });
    expect(f.manga).toBe(1);
    expect(f.chapters).toBe(20);
    expect(f.running.manga).toEqual({ done: 20, all: 100 });
  });
});

describe("weekBounds", () => {
  it("cuts seven local days from midnight, so a clock change keeps every date", () => {
    const b = weekBounds(new Date(2026, 9, 24, 20, 0));
    expect(b.dayStarts).toHaveLength(8);
    expect(new Date(b.dayStarts[1] * 1000).getDate()).toBe(25);
    expect(new Date(b.dayStarts[2] * 1000).getDate()).toBe(26);
    expect(b.weekEnd).toBe(b.dayStarts[7]);
  });
});

describe("timetable and coming up share one week", () => {
  it("sends an episode past the last column to coming up, never to neither", () => {
    const b = weekBounds(new Date(2026, 9, 19, 20, 0));
    const now = Math.floor(new Date(2026, 9, 19, 20, 0).getTime() / 1000);
    const nextMonday = b.weekEnd + 10 * 3600;
    const e = airing(1, nextMonday);
    expect(timetableSlot(nextMonday, b.dayStarts)).toBeNull();
    expect(comingUp([e], now, b.weekEnd).map((x) => x.id)).toEqual([1]);
  });
});

describe("stackTops", () => {
  it("keeps cards in time order and pushes one that would overlap below its neighbour", () => {
    expect(stackTops([0.1, 0.1, 0.9], 220, 40)).toEqual([22, 62, 198]);
  });

  it("never overlaps late cards, even when that runs past the column", () => {
    const tops = stackTops([0.95, 0.96, 0.97], 220, 40);
    expect(tops[1] - tops[0]).toBeGreaterThanOrEqual(40);
    expect(tops[2] - tops[1]).toBeGreaterThanOrEqual(40);
  });
});

describe("pagerIndex", () => {
  it("names the page whose start is nearest, clamped to the pages there are", () => {
    expect(pagerIndex(0, 360, 2)).toBe(0);
    expect(pagerIndex(170, 360, 2)).toBe(0);
    expect(pagerIndex(190, 360, 2)).toBe(1);
    expect(pagerIndex(900, 360, 2)).toBe(1);
    expect(pagerIndex(50, 0, 2)).toBe(0);
  });
});
