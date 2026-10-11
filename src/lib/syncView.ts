/** What the sync panel says first, kept out of the component because a wrong precedence is invisible on screen. */

import type { RateSnapshot, SyncStatus } from "@/api/types";

/** The panel's opening sentence as a closed union; the component maps each kind through a literal `t()`. */
export type Headline =
  | { kind: "offline" }
  | { kind: "limited"; waitMs: number }
  | { kind: "unreachable" }
  | { kind: "sending"; count: number }
  | { kind: "pacing"; waitMs: number }
  | { kind: "asking"; source: string; more: number }
  | { kind: "queued"; count: number }
  | { kind: "synced" };

/** By precedence: AniList's own wait first, since nothing else can move until it ends. */
export function syncHeadline(status: SyncStatus): Headline {
  if (!status.connected) return { kind: "offline" };
  const { throttledForMs, throttleKind } = status.rate;
  if (throttledForMs != null && throttleKind === "retryAfter") return { kind: "limited", waitMs: throttledForMs };
  if (lostConnection(status)) return { kind: "unreachable" };
  if (status.draining) return { kind: "sending", count: status.queued.length };
  if (throttledForMs != null) return { kind: "pacing", waitMs: throttledForMs };
  if (status.inFlight.length > 0) {
    const oldest = status.inFlight.reduce((a, b) => (b.startedAgoMs > a.startedAgoMs ? b : a));
    return { kind: "asking", source: oldest.source, more: status.inFlight.length - 1 };
  }
  if (status.queued.length > 0) return { kind: "queued", count: status.queued.length };
  return { kind: "synced" };
}

/** The newest request never got an answer, so AniList could not be reached; the next answer that arrives ends it. */
function lostConnection(status: SyncStatus): boolean {
  const newest = status.recent[0];
  return newest != null && newest.outcome === "error" && newest.status == null;
}

/** The two states the sidebar's one line must not call synced; everything calmer keeps the list's own wording. */
export type SyncAlert = { kind: "limited"; waitMs: number } | { kind: "unreachable" };

export function syncAlert(status: SyncStatus | undefined): SyncAlert | null {
  if (!status) return null;
  const h = syncHeadline(status);
  if (h.kind === "limited" || h.kind === "unreachable") return h;
  return null;
}

export type HeadlineTone = "calm" | "busy" | "warn" | "off";

export function headlineTone(h: Headline): HeadlineTone {
  switch (h.kind) {
    case "synced":
      return "calm";
    case "offline":
      return "off";
    case "limited":
    case "unreachable":
    case "queued":
      return "warn";
    case "sending":
    case "pacing":
    case "asking":
      return "busy";
  }
}

/** AniList's accounting window; a wait drawn against it reads as "this much of a minute still to sit out". */
const WINDOW_MS = 60_000;

export type BudgetMeter =
  | { mode: "unknown" }
  | { mode: "budget"; fill: number; left: number; limit: number }
  | { mode: "wait"; fill: number };

/** The bar under the headline: the budget left, or during a wait the wait itself, draining towards empty. */
export function budgetMeter(rate: RateSnapshot): BudgetMeter {
  if (rate.throttledForMs != null) return { mode: "wait", fill: Math.min(1, rate.throttledForMs / WINDOW_MS) };
  if (rate.remaining == null || rate.limit == null || rate.limit <= 0) return { mode: "unknown" };
  return { mode: "budget", fill: Math.min(1, Math.max(0, rate.remaining / rate.limit)), left: rate.remaining, limit: rate.limit };
}

/** One row of "what happens next": a background pass, or a cached list that refreshes when a screen next reads it. */
export interface UpcomingRow {
  kind: "pass" | "list";
  /** A pass name (`airing` …) or a media type (`ANIME`, `MANGA`). */
  name: string;
  dueInMs: number | null;
  running: boolean;
  off: boolean;
}

/** Running first, then soonest, then the ones switched off, so the top row is always the next thing to happen. */
export function upcomingRows(status: SyncStatus): UpcomingRow[] {
  const rows: UpcomingRow[] = [
    ...status.upcoming.map((p) => ({ kind: "pass" as const, name: p.pass, dueInMs: p.dueInMs, running: p.running, off: p.off })),
    ...status.lists.map((l) => ({ kind: "list" as const, name: l.mediaType, dueInMs: l.freshForMs, running: false, off: false })),
  ];
  const rank = (r: UpcomingRow) => (r.running ? 0 : r.off ? 2 : 1);
  return rows.sort((a, b) => rank(a) - rank(b) || (a.dueInMs ?? Infinity) - (b.dueInMs ?? Infinity));
}
