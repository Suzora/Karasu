import { maxProgress, type MediaListEntry, type MediaListStatus, type MediaType } from "@/api/types";
import { fromList } from "@/lib/calendar";

/** Every decision the Overview makes, pure and tested, so its components only draw what these return. */

export const WEEK_SECS = 7 * 24 * 3600;
export const STRIP_SECS = 48 * 3600;
/** Past this many episodes a row of ticks stops being readable, and the card draws a bar instead. */
export const TICK_LIMIT = 40;

export type GreetingKey =
  | "dashboard.greetMorning"
  | "dashboard.greetDay"
  | "dashboard.greetEvening"
  | "dashboard.greetMorningPlain"
  | "dashboard.greetDayPlain"
  | "dashboard.greetEveningPlain";

/** The greeting for the hour; `named` false for a local profile, which has no account name to greet. */
export function greetingKey(hour: number, named = true): GreetingKey {
  if (hour < 11) return named ? "dashboard.greetMorning" : "dashboard.greetMorningPlain";
  if (hour < 18) return named ? "dashboard.greetDay" : "dashboard.greetDayPlain";
  return named ? "dashboard.greetEvening" : "dashboard.greetEveningPlain";
}

const watching = (e: MediaListEntry) => e.status === "CURRENT" || e.status === "REPEATING";

/** Watching and rewatching from both lists, the most recent edit first; the component cuts it to one row. */
export function continueRow(anime: MediaListEntry[], manga: MediaListEntry[]): { entry: MediaListEntry; type: MediaType }[] {
  return [
    ...anime.filter(watching).map((entry) => ({ entry, type: "ANIME" as const })),
    ...manga.filter(watching).map((entry) => ({ entry, type: "MANGA" as const })),
  ].sort((a, b) => b.entry.updatedAt - a.entry.updatedAt);
}

export function progressShare(done: number, total: number | null): number {
  if (!total) return 0;
  return Math.min(1, Math.max(0, done / total));
}

export type ProgressMarks = { kind: "ticks"; total: number; done: number } | { kind: "bar"; share: number };

export function progressMarks(done: number, total: number | null): ProgressMarks {
  if (total && total <= TICK_LIMIT) return { kind: "ticks", total, done };
  return { kind: "bar", share: progressShare(done, total) };
}

/** A spine's height in percent of the shelf: decoration that never changes between renders, not data. */
export function spineHeight(mediaId: number, index: number): number {
  return 66 + ((mediaId * 7 + index * 13) % 30);
}

export function shelfStatuses(): MediaListStatus[] {
  return ["CURRENT", "REPEATING", "PLANNING", "COMPLETED", "PAUSED", "DROPPED"];
}

/** Local midnight of today and the seven days after it, built from the calendar so a clock change keeps every date. */
export function weekBounds(now: Date): { dayStarts: number[]; weekEnd: number } {
  const dayStarts = Array.from({ length: 8 }, (_, i) => Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i).getTime() / 1000));
  return { dayStarts, weekEnd: dayStarts[7] };
}

/** Which of the seven days an airing falls on, and how far into that day; `dayStarts` comes from `weekBounds`. */
export function timetableSlot(airingAt: number, dayStarts: number[]): { day: number; fraction: number } | null {
  for (let day = 0; day < dayStarts.length - 1; day++) {
    const start = dayStarts[day];
    const end = dayStarts[day + 1];
    if (airingAt >= start && airingAt < end) return { day, fraction: (airingAt - start) / (end - start) };
  }
  return null;
}

/** Tops for a day's cards in time order: each at its hour, pushed below its neighbour where they would overlap. */
export function stackTops(fractions: number[], height: number, cardH: number): number[] {
  const tops: number[] = [];
  for (const f of fractions) {
    const at = Math.round(f * height);
    tops.push(tops.length ? Math.max(at, tops[tops.length - 1] + cardH) : at);
  }
  return tops;
}

/** What this week's timetable does not show: later episodes of what is being watched, and planned titles. */
export function comingUp(anime: MediaListEntry[], now: number, weekEnd = now + WEEK_SECS, limit = 6): MediaListEntry[] {
  return anime
    .filter((e) => {
      const at = e.media.nextAiringEpisode?.airingAt;
      if (at == null) return false;
      if (watching(e)) return at >= weekEnd;
      return e.status === "PLANNING" && at > now;
    })
    .sort((a, b) => a.media.nextAiringEpisode!.airingAt - b.media.nextAiringEpisode!.airingAt)
    .slice(0, limit);
}

/** The banner's strip: what airs within the next 48 hours, each at its place along the strip. */
export function stripItems(anime: MediaListEntry[], now: number): { entry: MediaListEntry; offset: number }[] {
  return anime
    .filter((e) => watching(e) || e.status === "PLANNING")
    .flatMap((entry) => {
      const at = entry.media.nextAiringEpisode?.airingAt;
      if (at == null || at <= now || at > now + STRIP_SECS) return [];
      return [{ entry, offset: (at - now) / STRIP_SECS }];
    })
    .sort((a, b) => a.offset - b.offset);
}

/** The banner's data line: how many episodes this week holds and when the next one airs. */
export function weekLine(anime: MediaListEntry[], now: number, weekEnd = now + WEEK_SECS): { count: number; nextAt: number | null } {
  const week = fromList(anime, now, weekEnd - 1);
  return { count: week.length, nextAt: week[0]?.airingAt ?? null };
}

export interface OverviewFigures {
  anime: number;
  manga: number;
  episodes: number;
  chapters: number;
  days: number;
  meanScore: number | null;
  running: { anime: { done: number; all: number }; manga: { done: number; all: number } };
}

const unique = (l: MediaListEntry[]) => [...new Map(l.map((e) => [e.mediaId, e])).values()];

function running(l: MediaListEntry[]): { done: number; all: number } {
  const current = l.filter((e) => e.status === "CURRENT" && maxProgress(e.media));
  return {
    done: current.reduce((s, e) => s + e.progress, 0),
    all: current.reduce((s, e) => s + (maxProgress(e.media) ?? 0), 0),
  };
}

export function overviewFigures(animeList: MediaListEntry[], mangaList: MediaListEntry[]): OverviewFigures {
  const anime = unique(animeList);
  const manga = unique(mangaList);
  const scored = anime.filter((e) => e.score > 0);
  return {
    anime: anime.length,
    manga: manga.length,
    episodes: anime.reduce((s, e) => s + e.progress, 0),
    chapters: manga.reduce((s, e) => s + e.progress, 0),
    days: anime.reduce((s, e) => s + e.progress * (e.media.duration ?? 24), 0) / 1440,
    meanScore: scored.length ? scored.reduce((s, e) => s + e.score, 0) / scored.length : null,
    running: { anime: running(anime), manga: running(manga) },
  };
}
