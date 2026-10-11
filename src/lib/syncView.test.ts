import { describe, expect, it } from "vitest";
import type { QueuedEdit, SyncStatus } from "@/api/types";
import { budgetMeter, headlineTone, syncHeadline, upcomingRows } from "./syncView";

const quiet = {
  remaining: 24,
  limit: 30,
  observedAgoMs: 1_200,
  throttledForMs: null,
  throttleKind: null,
};

const edit = (id: number): QueuedEdit => ({ id, kind: "save", subject: 5, fields: ["progress"], queuedAt: 1_700_000_000 });

const status = (over: Partial<SyncStatus> = {}): SyncStatus => ({
  connected: true,
  draining: false,
  queued: [],
  recent: [],
  traffic: { sources: [], throttled: 0, remaining: null, limit: null },
  rate: quiet,
  inFlight: [],
  upcoming: [],
  lists: [],
  ...over,
});

describe("syncHeadline", () => {
  it("calls a quiet signed-in account synced", () => {
    expect(syncHeadline(status())).toEqual({ kind: "synced" });
  });

  it("never calls a local list synced", () => {
    expect(syncHeadline(status({ connected: false }))).toEqual({ kind: "offline" });
  });

  /** AniList's own wait outranks everything, since nothing else can move until it ends. */
  it("puts AniList's wait above a running drain", () => {
    const s = status({ draining: true, queued: [edit(1)], rate: { ...quiet, throttledForMs: 38_000, throttleKind: "retryAfter" } });
    expect(syncHeadline(s)).toEqual({ kind: "limited", waitMs: 38_000 });
  });

  it("separates Karasu pacing itself from AniList refusing", () => {
    const s = status({ rate: { ...quiet, throttledForMs: 2_000, throttleKind: "preflight" } });
    expect(syncHeadline(s)).toEqual({ kind: "pacing", waitMs: 2_000 });
  });

  it("counts what a drain is sending", () => {
    expect(syncHeadline(status({ draining: true, queued: [edit(1), edit(2)] }))).toEqual({ kind: "sending", count: 2 });
  });

  it("names the oldest request in flight and counts the rest", () => {
    const s = status({
      inFlight: [
        { source: "airing", startedAgoMs: 900, waiting: false },
        { source: "mediaDetail", startedAgoMs: 100, waiting: false },
      ],
    });
    expect(syncHeadline(s)).toEqual({ kind: "asking", source: "airing", more: 1 });
  });

  /** A backlog waiting on a throttle is waiting for the throttle, so the sentence names the reason, not the count. */
  it("prefers the reason over the backlog", () => {
    const s = status({ queued: [edit(1)], rate: { ...quiet, throttledForMs: 5_000, throttleKind: "preflight" } });
    expect(syncHeadline(s)).toEqual({ kind: "pacing", waitMs: 5_000 });
  });

  it("reports a backlog nobody is sending", () => {
    expect(syncHeadline(status({ queued: [edit(1)] }))).toEqual({ kind: "queued", count: 1 });
  });

  it("gives every kind a tone", () => {
    expect(headlineTone({ kind: "synced" })).toBe("calm");
    expect(headlineTone({ kind: "limited", waitMs: 1 })).toBe("warn");
    expect(headlineTone({ kind: "offline" })).toBe("off");
    expect(headlineTone({ kind: "asking", source: "x", more: 0 })).toBe("busy");
  });
});

describe("budgetMeter", () => {
  it("fills by what is left", () => {
    expect(budgetMeter(quiet)).toEqual({ mode: "budget", fill: 0.8, left: 24, limit: 30 });
  });

  /** The client's seed is a guess, and a guess must not render as a measurement. */
  it("draws nothing it has not measured", () => {
    expect(budgetMeter({ ...quiet, remaining: null })).toEqual({ mode: "unknown" });
    expect(budgetMeter({ ...quiet, limit: null })).toEqual({ mode: "unknown" });
  });

  it("turns into a draining wait while throttled, capped at a full bar", () => {
    expect(budgetMeter({ ...quiet, throttledForMs: 30_000, throttleKind: "retryAfter" })).toEqual({ mode: "wait", fill: 0.5 });
    expect(budgetMeter({ ...quiet, throttledForMs: 120_000, throttleKind: "retryAfter" })).toEqual({ mode: "wait", fill: 1 });
  });
});

describe("upcomingRows", () => {
  it("merges passes and lists, running first, then soonest, then switched off", () => {
    const rows = upcomingRows(
      status({
        upcoming: [
          { pass: "sequel", dueInMs: 3_600_000, running: false, off: false },
          { pass: "stale", dueInMs: null, running: false, off: true },
          { pass: "site", dueInMs: null, running: true, off: false },
        ],
        lists: [{ mediaType: "ANIME", freshForMs: 600_000 }],
      }),
    );
    expect(rows.map((r) => r.name)).toEqual(["site", "ANIME", "sequel", "stale"]);
    expect(rows[1]).toEqual({ kind: "list", name: "ANIME", dueInMs: 600_000, running: false, off: false });
  });

  it("lists nothing for an account with nothing planned", () => {
    expect(upcomingRows(status())).toEqual([]);
  });
});
