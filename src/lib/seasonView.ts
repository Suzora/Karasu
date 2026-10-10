export type SeasonName = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface Period {
  season: SeasonName;
  year: number;
}

const SEASON_NAMES: readonly string[] = ["WINTER", "SPRING", "SUMMER", "FALL"];

/** The season the URL names, or `fallback` (the current one) when it names none or a malformed one. */
export function parsePeriod(params: URLSearchParams, fallback: Period): Period {
  const season = params.get("season") ?? "";
  const year = params.get("year") ?? "";
  if (!SEASON_NAMES.includes(season) || !/^\d{4}$/.test(year)) return fallback;
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
