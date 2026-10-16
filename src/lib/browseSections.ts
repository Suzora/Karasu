import type { MediaType } from "@/api/types";
import { blockReason, type BlockReason, type ContentFilterLevel, type Filterable } from "@/lib/contentFilter";
import { SEARCH_DEFAULTS, writeSearchView, type SearchView } from "@/lib/searchView";
import { shiftSeason, type Period } from "@/lib/seasonView";

/** A section of the search page with nothing typed; each key is an alias in its medium's browse query. */
export type MediaSectionKey = "trending" | "season" | "nextSeason" | "popular" | "manhwa" | "top";

/** Each medium's sections in the order they stack, the order AniList's own search page shows them in. */
export const MEDIA_SECTIONS: Record<MediaType, readonly MediaSectionKey[]> = {
  ANIME: ["trending", "season", "nextSeason", "popular", "top"],
  MANGA: ["trending", "popular", "manhwa", "top"],
};

/** The ranked section draws this many rows, and its alias asks for exactly that many. */
export const TOP_ROWS = 10;

/** AniList's largest page. */
const PAGE_CAP = 50;

/** Titles asked per cover row: the row the setting draws plus a few the content filter may take, never under twelve. */
export function rowRequestSize(coverCols: number): number {
  return Math.min(PAGE_CAP, Math.max(12, coverCols + 4));
}

/** The browse query's own variables; the content filter and the score format are the caller's, and manga has no seasons. */
export function browseVariables(type: MediaType, now: Period, perPage: number) {
  if (type === "MANGA") return { perPage };
  const next = shiftSeason(now, 1);
  return { perPage, season: now.season, year: now.year, nextSeason: next.season, nextYear: next.year };
}

/** The season a section is about, for the line beside its title; null for a section with none. */
export function sectionPeriod(key: MediaSectionKey, now: Period): Period | null {
  if (key === "season") return now;
  if (key === "nextSeason") return shiftSeason(now, 1);
  return null;
}

/** The search a section's "Show all" opens: the same sort and filters as the section, in the paged grid. */
export function showAllView(type: MediaType, key: MediaSectionKey, now: Period): SearchView {
  const base: SearchView = { ...SEARCH_DEFAULTS, scope: type };
  const period = sectionPeriod(key, now);
  switch (key) {
    case "trending":
      return { ...base, sort: "TRENDING_DESC" };
    case "season":
    case "nextSeason":
      return { ...base, sort: "POPULARITY_DESC", season: period!.season, year: String(period!.year) };
    case "popular":
      return { ...base, sort: "POPULARITY_DESC" };
    case "manhwa":
      return { ...base, sort: "POPULARITY_DESC", country: "KR" };
    case "top":
      return { ...base, sort: "SCORE_DESC" };
  }
}

/** A section's drawn titles, at most `room` with AniList's rank each, and the hidden ones that would have taken a place. */
export function cutSection<T extends Filterable & { id: number }>(media: readonly T[], room: number, level: ContentFilterLevel) {
  const shown: { media: T; rank: number }[] = [];
  const hidden: [number, BlockReason][] = [];
  for (const [i, m] of media.entries()) {
    if (shown.length >= room) break;
    const reason = blockReason(m, level);
    if (reason) hidden.push([m.id, reason]);
    else shown.push({ media: m, rank: i + 1 });
  }
  return { shown, hidden };
}

/** Compared in the URL's own spelling, so two views that write the same address are the same view. */
const spelled = (view: SearchView) => writeSearchView(new URLSearchParams(), view).toString();

/** The section whose "Show all" a view is exactly, so the grid can name it; any refinement makes it a search of its own. */
export function sectionOfView(view: SearchView, now: Period): MediaSectionKey | null {
  const { scope } = view;
  if (scope !== "ANIME" && scope !== "MANGA") return null;
  const mine = spelled(view);
  return MEDIA_SECTIONS[scope].find((key) => spelled(showAllView(scope, key, now)) === mine) ?? null;
}

/** AniList's day for `isBirthday`, which turns at UTC midnight; it keys the cached answer so a day's birthdays end with it. */
export function birthdayDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}
