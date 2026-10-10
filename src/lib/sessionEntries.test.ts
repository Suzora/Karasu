import { afterEach, describe, expect, it, vi } from "vitest";
import type { ListEntryStub } from "@/api/queries";
import {
  cardEntry,
  forgetAllTold,
  forgetTold,
  noteAdded,
  noteRemoved,
  stubFromSave,
  subscribeTold,
  toldEntry,
} from "./sessionEntries";

const stub = (over: Partial<ListEntryStub> = {}): ListEntryStub => ({
  id: 1,
  status: "CURRENT",
  progress: 2,
  score: 0,
  repeat: 0,
  notes: null,
  ...over,
});

afterEach(forgetAllTold);

describe("what this session said about a title", () => {
  it("keeps an add with its entry and a removal as null, per account", () => {
    noteAdded(7, 21, stub({ status: "PLANNING" }));
    noteRemoved(7, 22);
    expect(toldEntry(7, 21)?.status).toBe("PLANNING");
    expect(toldEntry(7, 22)).toBeNull();
    // Another account was told nothing about either.
    expect(toldEntry(8, 21)).toBeUndefined();
    expect(toldEntry(8, 22)).toBeUndefined();
  });

  it("lets a later word replace an earlier one, and forgets a title the list holds again", () => {
    noteRemoved(7, 21);
    noteAdded(7, 21, stub());
    expect(toldEntry(7, 21)?.status).toBe("CURRENT");
    forgetTold(7, 21);
    expect(toldEntry(7, 21)).toBeUndefined();
  });

  it("tells a subscriber about every change, and stops when it unsubscribes", () => {
    const listener = vi.fn();
    const stop = subscribeTold(listener);
    noteAdded(7, 21, stub());
    noteRemoved(7, 21);
    forgetTold(7, 99);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
    noteAdded(7, 21, stub());
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("a discovery card's entry", () => {
  const listed = { mediaId: 21, status: "COMPLETED" };

  it("reads the cached list first, whatever the session or the response said", () => {
    expect(cardEntry(listed, null, stub())).toBe(listed);
    expect(cardEntry(listed, stub({ status: "PLANNING" }), null)).toBe(listed);
  });

  it("takes this session's word where the list cannot show the title", () => {
    expect(cardEntry(undefined, null, stub())).toBeNull();
    expect(cardEntry(undefined, stub({ status: "PLANNING" }), null)?.status).toBe("PLANNING");
  });

  it("believes the response when neither knows, so a hidden entry or one added elsewhere stays listed", () => {
    expect(cardEntry(undefined, undefined, stub())?.status).toBe("CURRENT");
    expect(cardEntry(undefined, undefined, null)).toBeNull();
  });
});

describe("the entry a write made", () => {
  it("comes from AniList's echo when it names a status", () => {
    const echo = { id: 9, status: "COMPLETED", progress: 28, score: 9, repeat: 0, notes: null };
    expect(stubFromSave({ status: "PLANNING" }, echo)).toMatchObject({ id: 9, status: "COMPLETED", progress: 28 });
  });

  it("comes from what was sent when the echo names none, as the local profile's does", () => {
    expect(stubFromSave({ status: "CURRENT", progress: 3 }, { id: 5 })).toEqual({
      id: 0,
      status: "CURRENT",
      progress: 3,
      score: 0,
      repeat: 0,
      notes: null,
    });
  });
});
