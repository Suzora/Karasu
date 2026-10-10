import type { ListEntryStub } from "@/api/queries";
import type { MediaListStatus } from "@/api/types";
import { entryFromEcho } from "@/lib/listEcho";

/** What this session's own writes said about a title the cached list cannot show: added with this entry, or removed. */
const told = new Map<string, ListEntryStub | null>();
const listeners = new Set<() => void>();
const at = (userId: number, mediaId: number) => `${userId}:${mediaId}`;
const changed = () => {
  for (const listener of listeners) listener();
};

export function noteAdded(userId: number, mediaId: number, entry: ListEntryStub): void {
  told.set(at(userId, mediaId), entry);
  changed();
}

export function noteRemoved(userId: number, mediaId: number): void {
  told.set(at(userId, mediaId), null);
  changed();
}

/** The list holds the title again, so it is the one to read and this session's word about it goes. */
export function forgetTold(userId: number, mediaId: number): void {
  if (told.delete(at(userId, mediaId))) changed();
}

/** Undefined when this session said nothing about the title, null when it removed it. */
export function toldEntry(userId: number, mediaId: number): ListEntryStub | null | undefined {
  return told.get(at(userId, mediaId));
}

export function subscribeTold(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** For tests: everything this session said goes. */
export function forgetAllTold(): void {
  told.clear();
  changed();
}

/** The entry a write just made, from AniList's echo, or from what was sent where the echo names no status. */
export function stubFromSave(
  input: { status?: MediaListStatus; progress?: number; score?: number; repeat?: number; notes?: string | null },
  echo: unknown,
): ListEntryStub {
  return (
    entryFromEcho(echo) ?? {
      id: 0,
      status: input.status ?? "PLANNING",
      progress: input.progress ?? 0,
      score: input.score ?? 0,
      repeat: input.repeat ?? 0,
      notes: input.notes ?? null,
    }
  );
}

/** A discovery card's entry: the cached list's, else this session's own word, else what the response said. */
export function cardEntry<L>(listed: L | undefined, said: ListEntryStub | null | undefined, stub: ListEntryStub | null) {
  if (listed !== undefined) return listed;
  if (said !== undefined) return said;
  return stub;
}
