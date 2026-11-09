import type { MediaListEntry } from "@/api/types";
import { catchUp, weekBounds, weekLine } from "@/lib/overview";
import { CATEGORIES, type Catalogue, type DayWindow, type GreetingLine, type Need } from "./types";

/** What the lists say right now, already cut to titles the greeting may name. */
export interface GreetingFacts {
  airingToday?: { title: string; at: number };
  behind?: { title: string; n: number };
  nearlyDone?: { title: string; n: number };
  lastOne?: { title: string };
  week: number;
  listEmpty: boolean;
  completed: number;
  manga?: string;
  awayDays: number;
}

export interface GreetingContext {
  now: Date;
  named: boolean;
  facts: GreetingFacts;
}

export interface PickedLine extends GreetingLine {
  id: string;
}

/** How many shown ids are kept out of the next picks. */
export const RECENT_SIZE = 30;
/** Titles longer than this are cut, so a line keeps its shape in the banner. */
const TITLE_MAX = 28;

export function dayWindow(hour: number): DayWindow {
  if (hour < 5) return "night";
  if (hour < 8) return "early";
  if (hour < 11) return "morning";
  if (hour < 14) return "noon";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "late";
}

const watching = (e: MediaListEntry) => e.status === "CURRENT" || e.status === "REPEATING";
const cut = (title: string) => (title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1).trimEnd()}…` : title);

/** Reads the facts from the lists; `nameable` refuses a title the content filter would hide or blur. */
export function greetingFacts(
  anime: MediaListEntry[],
  manga: MediaListEntry[],
  now: Date,
  awayDays: number,
  titleOf: (e: MediaListEntry) => string,
  nameable: (e: MediaListEntry) => boolean,
): GreetingFacts {
  const secs = Math.floor(now.getTime() / 1000);
  const shown = anime.filter(nameable);
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() / 1000;
  const today = shown
    .filter((e) => watching(e) && (e.media.nextAiringEpisode?.airingAt ?? 0) > secs && e.media.nextAiringEpisode!.airingAt < midnight)
    .sort((a, b) => a.media.nextAiringEpisode!.airingAt - b.media.nextAiringEpisode!.airingAt)[0];
  const behind = catchUp(shown, secs).find((c) => c.behind >= 2);
  const left = (e: MediaListEntry) => (e.media.episodes ? e.media.episodes - e.progress : 0);
  const nearly = shown.filter((e) => watching(e) && left(e) >= 2 && left(e) <= 3).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const last = shown.filter((e) => watching(e) && left(e) === 1).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const reading = manga.filter((e) => nameable(e) && watching(e)).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return {
    airingToday: today && { title: cut(titleOf(today)), at: today.media.nextAiringEpisode!.airingAt },
    behind: behind && { title: cut(titleOf(behind.entry)), n: behind.behind },
    nearlyDone: nearly && { title: cut(titleOf(nearly)), n: left(nearly) },
    lastOne: last && { title: cut(titleOf(last)) },
    week: weekLine(anime, secs, weekBounds(now).weekEnd).count,
    listEmpty: anime.length === 0 && manga.length === 0,
    completed: [...anime, ...manga].filter((e) => e.status === "COMPLETED").length,
    manga: reading && cut(titleOf(reading)),
    awayDays,
  };
}

function needMet(need: Need, f: GreetingFacts, now: Date): boolean {
  switch (need) {
    case "airingToday":
      return !!f.airingToday;
    case "behind":
      return !!f.behind;
    case "nearlyDone":
      return !!f.nearlyDone;
    case "lastOne":
      return !!f.lastOne;
    case "newThisWeek":
      return f.week >= 2;
    case "nothingThisWeek":
      return f.week === 0 && !f.listEmpty;
    case "completed":
      return f.completed >= 10;
    case "round":
      return f.completed >= 100 && f.completed % 50 === 0;
    case "reading":
      return !!f.manga;
    case "away":
      return f.awayDays >= 3;
    case "seasonStart":
      return now.getMonth() % 3 === 0 && now.getDate() <= 10;
  }
}

const mmdd = (d: Date) => `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Removes the name from a line for a profile without an account, or answers null when it cannot. */
export function withoutName(text: string): string | null {
  if (!text.includes("{name}")) return text;
  const stripped = text
    // The full-width comma and stops too, which Chinese and Japanese greetings use.
    .replace(/[,，、]\s*\{name\}(?=[.!?…。！？])/, "")
    .replace(/^\{name\}[,，、]\s*(\S)/, (_, c: string) => c.toUpperCase());
  return stripped.includes("{name}") ? null : stripped;
}

/** Every line of the catalogue with its id, in catalogue order. */
export function allLines(catalogue: Catalogue): PickedLine[] {
  return CATEGORIES.flatMap((cat) => catalogue[cat].map((l, i) => ({ ...l, id: `${cat}${i + 1}` })));
}

/** The lines that fit this moment, these lists and this profile. */
export function candidates(lines: PickedLine[], ctx: GreetingContext): PickedLine[] {
  const window = dayWindow(ctx.now.getHours());
  const day = mmdd(ctx.now);
  return lines.filter(
    (l) =>
      (!l.w || l.w.includes(window)) &&
      (!l.d || l.d.includes(ctx.now.getDay())) &&
      (!l.m || l.m.includes(ctx.now.getMonth() + 1)) &&
      (!l.on || l.on.includes(day)) &&
      (l.need ?? []).every((n) => needMet(n, ctx.facts, ctx.now)) &&
      (ctx.named || (!l.named && withoutName(l.text) != null)),
  );
}

/** A dated or data-backed line is rarer, so it weighs more when it fits. */
function weight(l: GreetingLine): number {
  return 1 + (l.on ? 6 : 0) + (l.need?.length ? 3 : 0) + (l.d ? 1 : 0) + (l.m ? 0.5 : 0);
}

/** A weighted draw that leaves out the recently shown ids while anything else is left. */
export function pickGreeting(pool: PickedLine[], recent: string[], rand: () => number): PickedLine | null {
  const fresh = pool.filter((l) => !recent.includes(l.id));
  const from = fresh.length > 0 ? fresh : pool;
  const total = from.reduce((s, l) => s + weight(l), 0);
  let at = rand() * total;
  for (const l of from) {
    at -= weight(l);
    if (at < 0) return l;
  }
  return from[from.length - 1] ?? null;
}

/** Fills the placeholders; `duration` words a countdown in seconds. */
export function fillGreeting(l: GreetingLine, ctx: GreetingContext, name: string | null, duration: (secs: number) => string): string {
  const f = ctx.facts;
  const needs = l.need ?? [];
  const title = needs.includes("airingToday")
    ? f.airingToday?.title
    : needs.includes("behind")
      ? f.behind?.title
      : needs.includes("nearlyDone")
        ? f.nearlyDone?.title
        : f.lastOne?.title;
  const n = needs.includes("behind") ? f.behind?.n : f.nearlyDone?.n;
  const values: Record<string, string> = {
    title: title ?? "",
    n: String(n ?? ""),
    when: f.airingToday ? duration(f.airingToday.at - Math.floor(ctx.now.getTime() / 1000)) : "",
    count: String(f.week),
    done: String(f.completed),
    manga: f.manga ?? "",
    days: String(f.awayDays),
  };
  const text = name ? l.text : (withoutName(l.text) ?? l.text);
  return text.replace(/\{(\w+)\}/g, (_, key: string) => (key === "name" ? (name ?? "") : (values[key] ?? "")));
}
