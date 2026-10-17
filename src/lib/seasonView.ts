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
