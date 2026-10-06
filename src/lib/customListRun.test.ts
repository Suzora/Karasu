import { describe, expect, it, vi } from "vitest";
import type { ListOptionsAnswer, ListTypeShape } from "@/api/social";
import type { ListResult, MediaListEntry } from "@/api/types";
import { entry, listResult, media } from "@/test/fixtures";
import type { Member } from "./customListOps";
import { fullWrite, ListRunError, runListOp, sideEffects, type ListRunDeps } from "./customListRun";

const SECTIONS = ["Watching", "Completed", "Planning"];

const options = (customLists: string[], over: Partial<ListTypeShape> = {}): ListOptionsAnswer => ({
  animeList: {
    customLists,
    sectionOrder: SECTIONS,
    splitCompletedSectionByFormat: false,
    advancedScoring: ["Story"],
    advancedScoringEnabled: false,
    ...over,
  },
  mangaList: null,
});

const row = (id: number, lists: Record<string, boolean>, hidden = false): MediaListEntry =>
  entry({ id, media: media({ id: 1000 + id }), customLists: lists, hiddenFromStatusLists: hidden });

/** A fake account: the options and list it answers, every call recorded in order. */
function account(opts: {
  lists: string[];
  before: MediaListEntry[];
  after?: MediaListEntry[];
  pending?: number;
  echo?: (w: string[]) => string[];
  cached?: "before" | "after";
  noOptions?: boolean;
}) {
  const calls: string[] = [];
  let fetches = 0;
  const deps: ListRunDeps = {
    readOptions: vi.fn(async () => (calls.push("read"), opts.noOptions ? { animeList: null, mangaList: null } : options(opts.lists))),
    writeOptions: vi.fn(async (w) => (calls.push(`write:${w.customLists.join(",")}`), options(opts.echo ? opts.echo(w.customLists) : w.customLists))),
    fetchList: vi.fn(async (force: boolean): Promise<ListResult> => {
      calls.push(force ? "fetch" : "cached");
      const first = fetches++ === 0;
      const rows = first ? opts.before : (opts.after ?? opts.before);
      const fromCache = (first && opts.cached === "before") || (!first && opts.cached === "after");
      return listResult(rows, { pending: opts.pending ?? 0, fromCache });
    }),
    save: vi.fn(async (input) => (calls.push(`save:${input.mediaId}:${input.customLists?.join(",")}`), { queued: false, entry: null })),
    unhide: vi.fn(async (entries: Member[]) => (calls.push(`unhide:${entries.map((e) => e.id).join(",")}`), entries.length)),
  };
  return { deps, calls };
}

describe("runListOp", () => {
  it("creates with a read, the write and one list fetch, and repairs nothing", async () => {
    const { deps, calls } = account({ lists: ["A"], before: [row(1, { A: true })] });
    const res = await runListOp("ANIME", { kind: "create", name: "B" }, deps);
    expect(calls).toEqual(["read", "write:A,B", "fetch"]);
    expect(res.repaired).toBe(0);
    expect(res.options.customLists).toEqual(["A", "B"]);
  });

  it("renames with a snapshot first, and finds nothing to repair when AniList carried the members", async () => {
    const { deps, calls } = account({
      lists: ["A", "B"],
      before: [row(1, { A: true, B: false })],
      after: [row(1, { Z: true, B: false })],
    });
    const res = await runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps);
    expect(calls).toEqual(["read", "fetch", "write:Z,B", "fetch"]);
    expect(res.repaired).toBe(0);
  });

  it("writes back each drifted entry's whole membership, then reads the patched copy for nothing", async () => {
    const { deps, calls } = account({
      lists: ["A", "B"],
      before: [row(1, { A: true, B: true }), row(2, { B: true })],
      after: [row(1, { B: false }), row(2, { B: true })],
    });
    const res = await runListOp("ANIME", { kind: "delete", name: "A" }, deps);
    expect(calls).toEqual(["read", "fetch", "write:B", "fetch", "save:1001:B", "cached"]);
    expect(res.repaired).toBe(1);
  });

  it("unhides the entries a delete would strand before it writes, and only when asked", async () => {
    const before = [row(1, { A: true }, true), row(2, { A: true, B: true }, true)];
    const asked = account({ lists: ["A", "B"], before });
    await runListOp("ANIME", { kind: "delete", name: "A" }, asked.deps, { offered: [1], unhide: true });
    expect(asked.calls.slice(0, 4)).toEqual(["read", "fetch", "unhide:1", "write:B"]);
    const notAsked = account({ lists: ["A", "B"], before });
    await runListOp("ANIME", { kind: "delete", name: "A" }, notAsked.deps, { offered: [1], unhide: false });
    expect(notAsked.deps.unhide).not.toHaveBeenCalled();
  });

  it("stops before anything is written when the fresh read strands an entry the dialog never offered", async () => {
    const { deps } = account({ lists: ["A", "B"], before: [row(1, { A: true }, true), row(2, { A: true }, true)] });
    await expect(
      runListOp("ANIME", { kind: "delete", name: "A" }, deps, { offered: [1], unhide: true }),
    ).rejects.toMatchObject({ failure: { code: "stale" } });
    expect(deps.unhide).not.toHaveBeenCalled();
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("writes nothing when the list before the write could only come from the offline copy", async () => {
    const { deps } = account({ lists: ["A"], before: [row(1, { A: true })], cached: "before" });
    await expect(runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps)).rejects.toMatchObject({
      failure: { code: "offline" },
    });
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("repairs nothing against a read after the write that fell back to the offline copy, and says so", async () => {
    const { deps } = account({ lists: ["A"], before: [row(1, { A: true }), row(2, { A: true })], cached: "after" });
    const res = await runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps);
    expect(res.verified).toBe(false);
    expect(deps.save).not.toHaveBeenCalled();
  });

  it("reports a landed write whose re-read throws as unchecked, never as a failed change", async () => {
    const { deps } = account({ lists: ["A"], before: [row(1, { A: true })] });
    vi.mocked(deps.fetchList).mockResolvedValueOnce(listResult([row(1, { A: true })])).mockRejectedValueOnce(new Error("HTTP 500"));
    const res = await runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps);
    expect(res.verified).toBe(false);
    expect(res.list).toBeNull();
    expect(deps.save).not.toHaveBeenCalled();
  });

  it("says what an unhide already changed when the write after it fails", async () => {
    const { deps } = account({ lists: ["A", "B"], before: [row(1, { A: true }, true)] });
    vi.mocked(deps.writeOptions).mockRejectedValueOnce(new Error("HTTP 502"));
    await expect(
      runListOp("ANIME", { kind: "delete", name: "A" }, deps, { offered: [1], unhide: true }),
    ).rejects.toMatchObject({ failure: { code: "failed" }, unhidden: 1 });
  });

  it("refuses to treat a missing options answer as an account without lists", async () => {
    const { deps } = account({ lists: ["A"], before: [], noOptions: true });
    await expect(runListOp("ANIME", { kind: "create", name: "B" }, deps)).rejects.toMatchObject({
      failure: { code: "unreadable" },
    });
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("refuses a bad name before any write", async () => {
    const { deps } = account({ lists: ["Ghibli"], before: [] });
    await expect(runListOp("ANIME", { kind: "create", name: " ghibli " }, deps)).rejects.toEqual(
      new ListRunError({ code: "invalid", problem: "duplicate" }),
    );
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("stops when the account changed since the screen was drawn", async () => {
    const { deps } = account({ lists: ["B"], before: [] });
    await expect(runListOp("ANIME", { kind: "delete", name: "A" }, deps)).rejects.toMatchObject({ failure: { code: "stale" } });
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("stops while queued saves could replay the old names", async () => {
    const { deps } = account({ lists: ["A"], before: [row(1, { A: true })], pending: 2 });
    await expect(runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps)).rejects.toMatchObject({
      failure: { code: "queued" },
    });
    expect(deps.writeOptions).not.toHaveBeenCalled();
  });

  it("writes nothing more when AniList's answer is not what was sent", async () => {
    const { deps } = account({ lists: ["A"], before: [row(1, { A: true })], echo: (w) => [...w].reverse() });
    await expect(runListOp("ANIME", { kind: "create", name: "B" }, deps)).rejects.toMatchObject({ failure: { code: "mismatch" } });
    expect(deps.fetchList).not.toHaveBeenCalled();
    expect(deps.save).not.toHaveBeenCalled();
  });

  it("counts a failed repair and keeps going", async () => {
    const { deps } = account({
      lists: ["A"],
      before: [row(1, { A: true }), row(2, { A: true })],
      after: [row(1, {}), row(2, {})],
    });
    vi.mocked(deps.save).mockRejectedValueOnce(new Error("boom"));
    const res = await runListOp("ANIME", { kind: "rename", from: "A", to: "Z" }, deps);
    expect(res.unrepaired).toBe(1);
    expect(res.repaired).toBe(1);
  });
});

describe("fullWrite", () => {
  it("sends back every option the read named, so a write AniList takes whole resets none of them", () => {
    const read = { ...options(["A"], { splitCompletedSectionByFormat: true, advancedScoringEnabled: true }).animeList! };
    expect(fullWrite({ customLists: ["A", "B"] }, read)).toEqual({
      customLists: ["A", "B"],
      sectionOrder: SECTIONS,
      splitCompletedSectionByFormat: true,
      advancedScoring: ["Story"],
      advancedScoringEnabled: true,
    });
  });

  it("keeps a moved section order and never sends a value the read did not have", () => {
    const read = { ...options(["A"]).animeList!, splitCompletedSectionByFormat: null, advancedScoring: null, sectionOrder: [] };
    expect(fullWrite({ customLists: ["Z"], sectionOrder: ["Z"] }, read)).toEqual({
      customLists: ["Z"],
      sectionOrder: ["Z"],
      advancedScoringEnabled: false,
    });
    expect(fullWrite({ customLists: ["Z"] }, read)).toEqual({ customLists: ["Z"], advancedScoringEnabled: false });
  });
});

describe("sideEffects", () => {
  const base = options([]).animeList!;
  const sent = fullWrite({ customLists: [] }, base);

  it("names an option AniList kept differently from what was sent", () => {
    expect(sideEffects(sent, base)).toEqual([]);
    expect(sideEffects(sent, { ...base, splitCompletedSectionByFormat: true })).toEqual(["split"]);
    expect(sideEffects(sent, { ...base, advancedScoring: [] })).toEqual(["advancedScoring"]);
  });

  it("compares nothing that was not sent", () => {
    expect(sideEffects({ customLists: [] }, { ...base, splitCompletedSectionByFormat: true })).toEqual([]);
  });
});
