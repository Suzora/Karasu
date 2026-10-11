import { describe, expect, it } from "vitest";
import { isQueueField, queuedMediaId } from "./syncQueue";

describe("queuedMediaId", () => {
  // Built so entry A's list-entry id is entry B's media id; a lookup trying both fields labels the wrong title.
  const entries = [
    { id: 500, mediaId: 1 },
    { id: 7, mediaId: 500 },
  ];

  it("reads a save's subject as a media id and nothing else", () => {
    expect(queuedMediaId({ kind: "save", subject: 500 }, entries)).toBe(500);
    // Not entry A, whose list-entry id is also 500.
    expect(queuedMediaId({ kind: "save", subject: 999 }, entries)).toBe(999);
  });

  it("reads a delete's subject as a list-entry id and nothing else", () => {
    expect(queuedMediaId({ kind: "delete", subject: 500 }, entries)).toBe(1);
    expect(queuedMediaId({ kind: "delete", subject: 7 }, entries)).toBe(500);
  });

  it("says nothing rather than guessing", () => {
    // A delete for an entry the loaded list no longer holds.
    expect(queuedMediaId({ kind: "delete", subject: 404 }, entries)).toBeNull();
    // A payload the backend could not parse.
    expect(queuedMediaId({ kind: "save", subject: null }, entries)).toBeNull();
    expect(queuedMediaId({ kind: "delete", subject: 500 }, [])).toBeNull();
  });
});

describe("isQueueField", () => {
  it("recognises the schema's own argument names", () => {
    expect(isQueueField("progress")).toBe(true);
    expect(isQueueField("scoreRaw")).toBe(true);
  });

  /** `scoreFormat` is stripped by the backend; anything else is new to us. */
  it("rejects what it has no label for", () => {
    expect(isQueueField("scoreFormat")).toBe(false);
    expect(isQueueField("somethingAniListAddedLater")).toBe(false);
  });
});
