import { FORMAT_ORDER, groupByFormat } from "./formatGroups";

export type SeasonName = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface Period {
  season: SeasonName;
  year: number;
}

/** AniList's four seasons in calendar order: January to March is winter. */
const SEASON_NAMES: readonly SeasonName[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

/** The season a local date falls in. */
export function seasonOf(date: Date): Period {
  return { season: SEASON_NAMES[Math.floor(date.getMonth() / 3)], year: date.getFullYear() };
}

/** The season one step later or earlier, across a year's end either way. */
export function shiftSeason({ season, year }: Period, step: 1 | -1): Period {
  const i = SEASON_NAMES.indexOf(season) + step;
  if (i < 0) return { season: "FALL", year: year - 1 };
  if (i > 3) return { season: "WINTER", year: year + 1 };
  return { season: SEASON_NAMES[i], year };
}

/** The season the URL names, or `fallback` (the current one) when it names none or a malformed one. */
export function parsePeriod(params: URLSearchParams, fallback: Period): Period {
  const season = params.get("season") ?? "";
  const year = params.get("year") ?? "";
  if (!(SEASON_NAMES as readonly string[]).includes(season) || !/^\d{4}$/.test(year)) return fallback;
  return { season: season as SeasonName, year: Number(year) };
}

/** Names the season only when it is not `now`, so a click on Seasonal while on the current one stays a same-URL replace. */
export function writePeriod(prev: URLSearchParams, period: Period, now: Period): URLSearchParams {
  const p = new URLSearchParams(prev);
  if (period.season === now.season && period.year === now.year) {
    p.delete("season");
    p.delete("year");
  } else {
    p.set("season", period.season);
    p.set("year", String(period.year));
  }
  return p;
}

/** The same season a year later or earlier, the step the year arrows take. */
export function yearStep({ season, year }: Period, step: 1 | -1): Period {
  return { season, year: year + step };
}

export interface SeasonFilters {
  /** One AniList format, or empty for all of them. */
  format: string;
  /** Leave out what is already on the list. */
  unlisted: boolean;
  /** Highest community score first instead of AniList's popularity order. */
  byScore: boolean;
}

/** The filters the URL names; a format outside `FORMAT_ORDER` reads as all formats. */
export function parseSeasonFilters(params: URLSearchParams): SeasonFilters {
  const format = params.get("format") ?? "";
  return {
    format: (FORMAT_ORDER as readonly string[]).includes(format) ? format : "",
    unlisted: params.get("unlisted") === "1",
    byScore: params.get("sort") === "score",
  };
}

/** Names only what differs from the default, so the plain season page keeps a bare URL. */
export function writeSeasonFilters(prev: URLSearchParams, f: SeasonFilters): URLSearchParams {
  const p = new URLSearchParams(prev);
  const put = (key: string, value: string | null) => (value ? p.set(key, value) : p.delete(key));
  put("format", f.format || null);
  put("unlisted", f.unlisted ? "1" : null);
  put("sort", f.byScore ? "score" : null);
  return p;
}

type SeasonItem = { format?: string | null; averageScore?: number | null; mediaListEntry?: unknown };

/** The season's sections after the filters, with every format's count taken before them so the column holds still. */
export function seasonSections<T extends SeasonItem>(items: readonly T[], f: SeasonFilters) {
  const counts: Record<string, number> = {};
  for (const m of items) counts[m.format ?? ""] = (counts[m.format ?? ""] ?? 0) + 1;
  let kept = items.filter((m) => (!f.format || m.format === f.format) && (!f.unlisted || !m.mediaListEntry));
  if (f.byScore) kept = [...kept].sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));
  return { groups: groupByFormat(kept), counts, total: items.length };
}
