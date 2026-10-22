import type { FuzzyDate, MediaListEntry, MediaListStatus } from "@/api/types";
import { displayTitle } from "@/api/types";

/** Statistics AniList cannot answer, computed from the cached list; community scores are put on the display scale. */

export interface DeltaRow {
  mediaId: number;
  title: string;
  /** The user's score, in display units. */
  mine: number;
  /** The community mean, brought onto the same scale. */
  community: number;
  /** `mine - community` — negative means harsher than the crowd. */
  delta: number;
}

export interface ScoreDeltaSummary {
  /** Entries that carry both scores — the honest denominator. */
  count: number;
  meanMine: number;
  meanCommunity: number;
  /** Mean of the per-entry deltas. */
  meanDelta: number;
  /** The user's biggest downward disagreements, most negative first. */
  harshest: DeltaRow[];
  /** The biggest upward ones, most positive first. */
  kindest: DeltaRow[];
}

/** The user's scores against the community's where both exist; a missing score is skipped, never counted as zero. */
export function scoreDelta(
  entries: MediaListEntry[],
  top = 5,
  /** The display scale's maximum, from `scoreScale(format).max`. */
  max = 10,
): ScoreDeltaSummary | null {
  const seen = new Set<number>();
  const rows: DeltaRow[] = [];
  for (const e of entries) {
    if (seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    const community = e.media.averageScore;
    if (!e.score || e.score <= 0 || community == null || community <= 0) continue;
    const communityScaled = (community / 100) * max;
    rows.push({
      mediaId: e.mediaId,
      title: displayTitle(e.media.title),
      mine: e.score,
      community: communityScaled,
      delta: e.score - communityScaled,
    });
  }
  if (rows.length === 0) return null;

  const mean = (pick: (r: DeltaRow) => number) =>
    rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;
  const byDelta = [...rows].sort((a, b) => a.delta - b.delta);

  return {
    count: rows.length,
    meanMine: mean((r) => r.mine),
    meanCommunity: mean((r) => r.community),
    meanDelta: mean((r) => r.delta),
    harshest: byDelta.filter((r) => r.delta < 0).slice(0, top),
    kindest: byDelta
      .filter((r) => r.delta > 0)
      .reverse()
      .slice(0, top),
  };
}

// --- Activity heatmap -------------------------------------------------------

export interface HeatmapYear {
  year: number;
  /** Events per calendar month, index 0 = January. */
  months: number[];
}

export interface ActivityHeatmap {
  /** Oldest first, at most `maxYears` of them. */
  years: HeatmapYear[];
  /** The busiest cell, for the intensity scale. */
  max: number;
  total: number;
}

/** Each start and completion with a known month is one event; a year-only date is skipped, never pinned to January. */
export function activityHeatmap(
  entries: MediaListEntry[],
  maxYears = 8,
): ActivityHeatmap | null {
  const byYear = new Map<number, number[]>();
  let total = 0;
  const record = (d: FuzzyDate | null) => {
    if (!d?.year || !d.month || d.month < 1 || d.month > 12) return;
    const months = byYear.get(d.year) ?? Array.from({ length: 12 }, () => 0);
    months[d.month - 1] += 1;
    byYear.set(d.year, months);
    total += 1;
  };
  for (const e of entries) {
    record(e.startedAt);
    record(e.completedAt);
  }
  if (total === 0) return null;

  const years = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(-maxYears)
    .map(([year, months]) => ({ year, months }));
  const max = Math.max(...years.flatMap((y) => y.months), 1);
  return { years, max, total };
}

// --- Totals -----------------------------------------------------------------

export interface LocalTotals {
  count: number;
  /** Episodes watched or chapters read, summed across the list. */
  progressTotal: number;
  scored: number;
  /** Mean of the scored entries, display units; 0 when nothing is scored. */
  meanScore: number;
  byStatus: { status: string; count: number }[];
  /** Score → how many entries hold it, for the distribution columns. */
  scoreCounts: { score: number; count: number }[];
  releaseYears: { year: number; count: number }[];
}

/** The figures AniList's statistics endpoint would return, counted from the list the caller has already filtered. */
export function localTotals(entries: MediaListEntry[]): LocalTotals {
  const byStatus = new Map<string, number>();
  const scores = new Map<number, number>();
  const years = new Map<number, number>();
  let progressTotal = 0;
  let scoreSum = 0;
  let scored = 0;

  for (const e of entries) {
    byStatus.set(e.status, (byStatus.get(e.status) ?? 0) + 1);
    progressTotal += e.progress ?? 0;
    if (e.score > 0) {
      scored += 1;
      scoreSum += e.score;
      scores.set(e.score, (scores.get(e.score) ?? 0) + 1);
    }
    // seasonYear is the year the title is from, which is what a release-year chart asks; a missing one is left out.
    const year = e.media.seasonYear;
    if (year) years.set(year, (years.get(year) ?? 0) + 1);
  }

  return {
    count: entries.length,
    progressTotal,
    scored,
    meanScore: scored > 0 ? scoreSum / scored : 0,
    byStatus: [...byStatus].map(([status, count]) => ({ status, count })),
    scoreCounts: [...scores]
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => a.score - b.score),
    releaseYears: [...years]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year),
  };
}

// --- Seasonal habits --------------------------------------------------------

export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
export type SeasonName = (typeof SEASONS)[number];

export interface SeasonCount {
  season: SeasonName;
  count: number;
  /** Mean of the user's own scores in that season, display units; 0 = unscored. */
  meanScore: number;
}

/** Which broadcast seasons the list draws from and how the user scored each; seasonless media are not a fifth bucket. */
export function seasonalHistory(entries: MediaListEntry[]): SeasonCount[] {
  const seen = new Set<number>();
  const counts = new Map<SeasonName, { count: number; scoreSum: number; scored: number }>();
  for (const e of entries) {
    const season = e.media.season as SeasonName | null;
    if (!season || !SEASONS.includes(season) || seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    const bucket = counts.get(season) ?? { count: 0, scoreSum: 0, scored: 0 };
    bucket.count += 1;
    if (e.score > 0) {
      bucket.scoreSum += e.score;
      bucket.scored += 1;
    }
    counts.set(season, bucket);
  }
  return SEASONS.filter((s) => counts.has(s)).map((season) => {
    const b = counts.get(season)!;
    return {
      season,
      count: b.count,
      meanScore: b.scored > 0 ? b.scoreSum / b.scored : 0,
    };
  });
}

// --- AniList's own activity history, at day resolution -------------------

/** AniList's own intensity buckets; use its level rather than re-deriving thresholds from amount locally. */
export const HISTORY_LEVELS = [1, 3, 5, 7, 9] as const;

/** The bucket's day as a UTC midnight; AniList stamps London midnights, so round to the nearest UTC day, never floor. */
export function historyDay(dateSeconds: number): number {
  return Math.round(dateSeconds / 86400) * 86400;
}

/** One cell of the day grid. `null` pads the first and last weeks. */
export interface HeatmapDay {
  /** UTC midnight of the day this cell is, in seconds. */
  day: number;
  amount: number;
  /** AniList's own bucket, 1–9. Zero for a day with no activity. */
  level: number;
}

export interface DayHeatmap {
  /** Columns, oldest first. Each is seven cells, Monday first. */
  weeks: (HeatmapDay | null)[][];
  /** Column index where each month's first cell falls, for the top axis. */
  months: { column: number; month: number }[];
  total: number;
  /** The range actually covered, as UTC midnights. */
  from: number;
  to: number;
}

/** AniList's activity history as a week-by-weekday grid, drawn over exactly the range given rather than a padded year. */
export function dayHeatmapFromHistory(
  history: { date: number; amount: number; level?: number | null }[] | null | undefined,
): DayHeatmap | null {
  const byDay = new Map<number, { amount: number; level: number }>();
  let total = 0;
  for (const entry of history ?? []) {
    if (!Number.isFinite(entry?.date) || !Number.isFinite(entry?.amount)) continue;
    const amount = Math.max(0, Math.trunc(entry.amount));
    if (amount === 0) continue;
    const day = historyDay(entry.date);
    const level = Number.isFinite(entry.level) ? Math.max(1, Math.trunc(entry.level as number)) : 1;
    const prev = byDay.get(day);
    // A duplicate day keeps the louder of the two rather than the later one.
    byDay.set(day, {
      amount: (prev?.amount ?? 0) + amount,
      level: Math.max(prev?.level ?? 0, level),
    });
    total += amount;
  }
  if (total === 0) return null;

  const days = [...byDay.keys()].sort((a, b) => a - b);
  const from = days[0];
  const to = days[days.length - 1];

  // Monday-first, as every locale this app ships expects; getUTCDay is Sunday-first, hence the rotation.
  const weekdayOf = (day: number) => (new Date(day * 1000).getUTCDay() + 6) % 7;
  const start = from - weekdayOf(from) * 86400;

  const weeks: (HeatmapDay | null)[][] = [];
  const months: { column: number; month: number }[] = [];
  // Keyed by year and month, and a month waits for a free column; a "last month seen" cursor loses whole months.
  const labelled = new Set<number>();
  for (let day = start, column = 0; day <= to; column += 1) {
    const week: (HeatmapDay | null)[] = [];
    for (let i = 0; i < 7; i += 1, day += 86400) {
      if (day < from || day > to) {
        week.push(null);
        continue;
      }
      const hit = byDay.get(day);
      week.push({ day, amount: hit?.amount ?? 0, level: hit?.level ?? 0 });
      const when = new Date(day * 1000);
      const key = when.getUTCFullYear() * 12 + when.getUTCMonth();
      // One label per column, and the leftmost column each month can have.
      if (!labelled.has(key) && !months.some((m) => m.column === column)) {
        labelled.add(key);
        months.push({ column, month: when.getUTCMonth() });
      }
    }
    weeks.push(week);
  }

  return { weeks, months, total, from, to };
}

// --- The insight panels: each reads the list (and AniList's history) and asks for nothing ---

/** One title the user and the community both scored, both on the display scale. */
export interface ScorePair {
  mediaId: number;
  title: string;
  mine: number;
  community: number;
}

/** Every title with both scores, once each; the scatter draws all of them where the dumbbell drew ten. */
export function scorePairs(entries: MediaListEntry[], max = 10): ScorePair[] {
  const seen = new Set<number>();
  const pairs: ScorePair[] = [];
  for (const e of entries) {
    if (seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    const community = e.media.averageScore;
    if (!e.score || e.score <= 0 || community == null || community <= 0) continue;
    pairs.push({ mediaId: e.mediaId, title: displayTitle(e.media.title), mine: e.score, community: (community / 100) * max });
  }
  return pairs;
}

export interface GenreDelta {
  genre: string;
  /** Mean of mine minus the community's over the genre's titles; positive is kinder. */
  delta: number;
  count: number;
}

/** Where the user is harsher or kinder than the community, per genre with at least `minCount` scored titles. */
export function genreDeltas(entries: MediaListEntry[], max = 10, minCount = 3, limit = 10): GenreDelta[] {
  const sums = new Map<string, { delta: number; count: number }>();
  const genresOf = new Map(entries.map((e) => [e.mediaId, e.media.genres ?? []]));
  for (const p of scorePairs(entries, max)) {
    for (const genre of genresOf.get(p.mediaId) ?? []) {
      const b = sums.get(genre) ?? { delta: 0, count: 0 };
      b.delta += p.mine - p.community;
      b.count += 1;
      sums.set(genre, b);
    }
  }
  return [...sums]
    .filter(([, b]) => b.count >= minCount)
    .map(([genre, b]) => ({ genre, delta: b.delta / b.count, count: b.count }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);
}

/** The statuses a started title can end in, finished first; planning means it never started. */
export const OUTCOME_ORDER: MediaListStatus[] = ["COMPLETED", "REPEATING", "CURRENT", "PAUSED", "DROPPED"];

export interface GenreOutcome {
  genre: string;
  total: number;
  /** Share of completed and rewatched titles, 0–1. */
  finished: number;
  byStatus: Partial<Record<MediaListStatus, number>>;
}

/** How the titles of each genre ended, for the genres with the most started titles. */
export function genreOutcomes(entries: MediaListEntry[], minCount = 3, limit = 8): GenreOutcome[] {
  const seen = new Set<number>();
  const byGenre = new Map<string, Partial<Record<MediaListStatus, number>>>();
  for (const e of entries) {
    if (seen.has(e.mediaId) || !OUTCOME_ORDER.includes(e.status)) continue;
    seen.add(e.mediaId);
    for (const genre of e.media.genres ?? []) {
      const counts = byGenre.get(genre) ?? {};
      counts[e.status] = (counts[e.status] ?? 0) + 1;
      byGenre.set(genre, counts);
    }
  }
  return [...byGenre]
    .map(([genre, byStatus]) => {
      const total = Object.values(byStatus).reduce((a, b) => a + (b ?? 0), 0);
      const finished = ((byStatus.COMPLETED ?? 0) + (byStatus.REPEATING ?? 0)) / total;
      return { genre, total, finished, byStatus };
    })
    .filter((r) => r.total >= minCount)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

/** The key of the band that holds every genre outside the top ones. */
export const OTHER_GENRES = "";

export interface GenreDriftData {
  years: number[];
  /** The top genres, most frequent first, then `OTHER_GENRES`. */
  keys: string[];
  /** One row per year, a count per key. */
  rows: Record<string, number>[];
}

/** Genre counts per start year (the completion year where no start is known), for the share-over-time area. */
export function genreDrift(entries: MediaListEntry[], top = 5, maxYears = 8): GenreDriftData | null {
  const seen = new Set<number>();
  const totals = new Map<string, number>();
  const perYear = new Map<number, Map<string, number>>();
  for (const e of entries) {
    const year = e.startedAt?.year ?? e.completedAt?.year;
    if (!year || seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    const counts = perYear.get(year) ?? new Map<string, number>();
    for (const genre of e.media.genres ?? []) {
      totals.set(genre, (totals.get(genre) ?? 0) + 1);
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
    perYear.set(year, counts);
  }
  const years = [...perYear.keys()].sort((a, b) => a - b).slice(-maxYears);
  if (years.length < 3) return null;
  const leaders = [...totals].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, top).map(([g]) => g);
  const rows = years.map((year) => {
    const row: Record<string, number> = Object.fromEntries(leaders.map((g) => [g, 0]));
    row[OTHER_GENRES] = 0;
    for (const [genre, n] of perYear.get(year)!) {
      if (leaders.includes(genre)) row[genre] = n;
      else row[OTHER_GENRES] += n;
    }
    return row;
  });
  return { years, keys: [...leaders, OTHER_GENRES], rows };
}

/** AniList's activity summed by weekday, Monday first; null for an account with none. */
export function weekdayTotals(history: { date: number; amount: number }[] | null | undefined): number[] | null {
  const days = Array.from({ length: 7 }, () => 0);
  let total = 0;
  for (const h of history ?? []) {
    if (!Number.isFinite(h?.date) || !Number.isFinite(h?.amount) || h.amount <= 0) continue;
    days[(new Date(historyDay(h.date) * 1000).getUTCDay() + 6) % 7] += h.amount;
    total += h.amount;
  }
  return total > 0 ? days : null;
}

/** Completions per calendar month, each title once; a date with no month is skipped, never pinned to January. */
export function completionMonths(entries: MediaListEntry[]): number[] | null {
  const seen = new Set<number>();
  const months = Array.from({ length: 12 }, () => 0);
  let total = 0;
  for (const e of entries) {
    const m = e.completedAt?.month;
    if (!m || m < 1 || m > 12 || seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    months[m - 1] += 1;
    total += 1;
  }
  return total > 0 ? months : null;
}

export interface PaceRow {
  format: string;
  count: number;
  q1: number;
  median: number;
  q3: number;
}

const dayOf = (d: FuzzyDate | null): number | null =>
  d?.year && d.month && d.day ? Date.UTC(d.year, d.month - 1, d.day) / 86_400_000 : null;

/** Linear-interpolated quantile of a sorted list. */
function quantileOf(sorted: number[], q: number): number {
  const at = (sorted.length - 1) * q;
  const lo = Math.floor(at);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (at - lo);
}

/** Days from the first to the last day per format, counted inclusively, for finished titles with both dates. */
export function completionPace(entries: MediaListEntry[], minCount = 3): PaceRow[] {
  const seen = new Set<number>();
  const spans = new Map<string, number[]>();
  for (const e of entries) {
    if (seen.has(e.mediaId) || (e.status !== "COMPLETED" && e.status !== "REPEATING")) continue;
    const a = dayOf(e.startedAt);
    const b = dayOf(e.completedAt);
    if (a == null || b == null || b < a) continue;
    seen.add(e.mediaId);
    const key = e.media.format ?? "";
    spans.set(key, [...(spans.get(key) ?? []), b - a + 1]);
  }
  return [...spans]
    .filter(([, v]) => v.length >= minCount)
    .map(([format, v]) => {
      const s = [...v].sort((p, q) => p - q);
      return { format, count: s.length, q1: quantileOf(s, 0.25), median: quantileOf(s, 0.5), q3: quantileOf(s, 0.75) };
    })
    .sort((a, b) => a.median - b.median);
}

export interface TimeShare {
  /** Minutes across the whole list. */
  total: number;
  rows: { mediaId: number; title: string; minutes: number }[];
}

/** Watch time per title (progress × runtime × every viewing), the longest first. */
export function timeShare(entries: MediaListEntry[], top = 10): TimeShare | null {
  const seen = new Set<number>();
  const rows: TimeShare["rows"] = [];
  for (const e of entries) {
    if (seen.has(e.mediaId) || !e.progress) continue;
    seen.add(e.mediaId);
    rows.push({ mediaId: e.mediaId, title: displayTitle(e.media.title), minutes: e.progress * (e.media.duration ?? 24) * (1 + (e.repeat ?? 0)) });
  }
  const total = rows.reduce((s, r) => s + r.minutes, 0);
  if (total === 0) return null;
  return { total, rows: rows.sort((a, b) => b.minutes - a.minutes).slice(0, top) };
}

/** Rewatches summed, the titles that have any, and the one seen most often in all. */
export function rewatchTotals(entries: MediaListEntry[]): { repeats: number; titles: number; most: { title: string; times: number } | null } {
  const seen = new Set<number>();
  let repeats = 0;
  let titles = 0;
  let most: { title: string; times: number } | null = null;
  for (const e of entries) {
    if (seen.has(e.mediaId)) continue;
    seen.add(e.mediaId);
    const n = e.repeat ?? 0;
    if (n <= 0) continue;
    repeats += n;
    titles += 1;
    if (!most || n + 1 > most.times) most = { title: displayTitle(e.media.title), times: n + 1 };
  }
  return { repeats, titles, most };
}
