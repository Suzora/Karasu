import { describe, expect, it } from "vitest";
import { advancedPatch, datePatch, flagPatch, listsPatch, statusPatch } from "./entryPatch";

const anime = { type: "ANIME" as const, episodes: 12, chapters: null, volumes: null };
const manga = { type: "MANGA" as const, episodes: null, chapters: 120, volumes: 12 };

describe("statusPatch", () => {
  /** Completing writes the totals it shows, so the saved numbers are the ones on screen. */
  it("fills the run when an entry is completed, and remembers what it replaced", () => {
    const out = statusPatch({ status: "CURRENT", progress: 7, volumes: 0 }, null, "COMPLETED", anime);
    expect(out.patch).toEqual({ status: "COMPLETED", progress: 12 });
    expect(out.memo).toEqual({ before: { progress: 7, volumes: 0 }, filled: { progress: 12, volumes: 0 } });
  });

  it("gives an untouched fill back when the status moves on again", () => {
    const done = statusPatch({ status: "CURRENT", progress: 7, volumes: 0 }, null, "COMPLETED", anime);
    const back = statusPatch(done.fields, done.memo, "PAUSED", anime);
    expect(back.patch).toEqual({ status: "PAUSED", progress: 7 });
    expect(back.memo).toBeNull();
  });

  it("writes the status alone when nothing else moves", () => {
    expect(statusPatch({ status: "CURRENT", progress: 3, volumes: 0 }, null, "PAUSED", anime).patch).toEqual({ status: "PAUSED" });
  });

  /** AniList would store a volume count on a TV series too, so volumes travel for manga only. */
  it("carries volumes for manga and never for anime", () => {
    expect(statusPatch({ status: "CURRENT", progress: 30, volumes: 3 }, null, "COMPLETED", manga).patch).toEqual({
      status: "COMPLETED",
      progress: 120,
      progressVolumes: 12,
    });
    expect(statusPatch({ status: "CURRENT", progress: 3, volumes: 4 }, null, "COMPLETED", anime).patch).not.toHaveProperty("progressVolumes");
  });
});

describe("the other single writes", () => {
  /** AniList's own spelling of "remove the date" is a date with every part null. */
  it("clears a date with all-null parts and sets one as given", () => {
    expect(datePatch("startedAt", null)).toEqual({ startedAt: { year: null, month: null, day: null } });
    expect(datePatch("completedAt", { year: 2026, month: 3, day: 1 })).toEqual({ completedAt: { year: 2026, month: 3, day: 1 } });
  });

  /** The write replaces the whole membership, so a toggle sends every list the entry is on, in the account's order. */
  it("sends the whole membership in the account's order", () => {
    expect(listsPatch(["Ghibli", "Airing", "Rewatch"], new Set(["Rewatch", "Ghibli"]))).toEqual({ customLists: ["Ghibli", "Rewatch"] });
    expect(listsPatch(["Ghibli"], new Set())).toEqual({ customLists: [] });
  });

  /** Hidden-from-status-lists is AniList's alone; the local schema stores privacy and nothing else of the two. */
  it("writes the hidden flag only to AniList", () => {
    expect(flagPatch(true, "hiddenFromStatusLists", true)).toEqual({ hiddenFromStatusLists: true });
    expect(flagPatch(false, "hiddenFromStatusLists", true)).toBeNull();
    expect(flagPatch(false, "private", true)).toEqual({ private: true });
  });

  /** The advanced scores are positional, so they are built from the account's category order, never the map's. */
  it("orders advanced scores by the account's categories and writes nothing without any", () => {
    expect(advancedPatch(["Story", "Art"], { Art: 8, Story: 6 })).toEqual({ advancedScores: [6, 8] });
    expect(advancedPatch([], { Art: 8 })).toBeNull();
  });
});
