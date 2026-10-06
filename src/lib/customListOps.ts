import type { MediaListGroup } from "@/api/types";

/** One change to an account's custom lists; the admin sends exactly one per write, so a failure has one cause. */
export type ListOp =
  | { kind: "create"; name: string }
  | { kind: "rename"; from: string; to: string }
  | { kind: "delete"; name: string };

/** The two arrays a custom-list write can touch, as `mediaListOptions.<type>List` reports them. */
export interface ListShape {
  customLists: string[];
  sectionOrder: string[];
}

/** What `UpdateUser` receives for one list type; `sectionOrder` rides along only when the op moved a name inside it. */
export interface ListOptionsWrite {
  customLists: string[];
  sectionOrder?: string[];
}

export type NameProblem = "empty" | "duplicate" | "reserved";

const fold = (s: string) => s.trim().toLocaleLowerCase();

/** The spelling a typed name is saved under: AniList keeps the raw string, so only the edges are trimmed. */
export const cleanName = (s: string) => s.trim();

/** Why a typed name cannot be used, or null; `self` is the list being renamed, which may change its own case. */
export function validateName(name: string, shape: ListShape, self?: string): NameProblem | null {
  const n = fold(name);
  if (!n) return "empty";
  const taken = shape.customLists.filter((l) => l !== self).map(fold);
  if (taken.includes(n)) return "duplicate";
  // A status section's name would make `sectionOrder` ambiguous between the section and the list.
  const sections = shape.sectionOrder.filter((s) => !shape.customLists.includes(s)).map(fold);
  if (sections.includes(n)) return "reserved";
  return null;
}

/** The arrays after one op, or null when the account no longer matches it (a list gone, or already there). */
export function planOp(op: ListOp, shape: ListShape): ListOptionsWrite | null {
  const { customLists, sectionOrder } = shape;
  switch (op.kind) {
    case "create":
      if (customLists.includes(op.name)) return null;
      // Left out of `sectionOrder`: the site appends a list it does not find there, which is what a new one wants.
      return { customLists: [...customLists, op.name] };
    case "rename": {
      const at = customLists.indexOf(op.from);
      if (at < 0 || op.from === op.to || customLists.includes(op.to)) return null;
      const renamed = customLists.map((l, i) => (i === at ? op.to : l));
      if (!sectionOrder.includes(op.from)) return { customLists: renamed };
      return { customLists: renamed, sectionOrder: sectionOrder.map((s) => (s === op.from ? op.to : s)) };
    }
    case "delete": {
      const at = customLists.indexOf(op.name);
      if (at < 0) return null;
      const kept = customLists.filter((_, i) => i !== at);
      if (!sectionOrder.includes(op.name)) return { customLists: kept };
      return { customLists: kept, sectionOrder: sectionOrder.filter((s) => s !== op.name) };
    }
  }
}

/** True when `after` is `before` with one name appended, replaced in place or removed, every other position kept. */
export function isSingleEdit(before: string[], after: string[]): boolean {
  if (after.length === before.length + 1) return before.every((n, i) => after[i] === n);
  if (after.length === before.length) return after.filter((n, i) => n !== before[i]).length === 1;
  if (after.length !== before.length - 1) return false;
  return before.some((_, gone) => before.filter((_, i) => i !== gone).every((n, i) => after[i] === n));
}

/** One entry's custom-list membership, read off the raw map's true keys. */
export interface Member {
  id: number;
  mediaId: number;
  lists: string[];
  hidden: boolean;
}

/** Every entry's membership by entry id; an entry shown in several groups is one member. */
export function snapshot(groups: MediaListGroup[]): Map<number, Member> {
  const out = new Map<number, Member>();
  for (const g of groups) {
    for (const e of g.entries) {
      if (out.has(e.id)) continue;
      const lists = Object.entries(e.customLists ?? {})
        .filter(([, on]) => on)
        .map(([name]) => name)
        .sort();
      out.set(e.id, { id: e.id, mediaId: e.mediaId, lists, hidden: e.hiddenFromStatusLists === true });
    }
  }
  return out;
}

/** The lists an entry should be in once `op` has landed, from what it was in before. */
export function expectedLists(op: ListOp, lists: string[]): string[] {
  switch (op.kind) {
    case "create":
      return lists;
    case "rename":
      return lists.map((l) => (l === op.from ? op.to : l)).sort();
    case "delete":
      return lists.filter((l) => l !== op.name);
  }
}

/** A repair: the whole membership one entry must be saved with, since `customLists` replaces it wholesale. */
export interface Repair {
  mediaId: number;
  lists: string[];
}

/** Entries whose membership after the write differs from what `op` should have left; deleted or new entries are skipped. */
export function drift(op: ListOp, before: Map<number, Member>, after: Map<number, Member>): Repair[] {
  const out: Repair[] = [];
  for (const [id, was] of before) {
    const want = expectedLists(op, was.lists);
    const now = after.get(id);
    if (!now) {
      // A hidden entry shows only through its custom lists, so one that lost them all is gone from the read, not deleted.
      if (was.hidden && want.length > 0) out.push({ mediaId: was.mediaId, lists: want });
      continue;
    }
    if (want.length !== now.lists.length || want.some((l, i) => now.lists[i] !== l)) {
      out.push({ mediaId: now.mediaId, lists: want });
    }
  }
  return out;
}

/** How many entries are in the named list. */
export function memberCount(members: Map<number, Member>, name: string): number {
  let n = 0;
  for (const m of members.values()) if (m.lists.includes(name)) n++;
  return n;
}

/** Entries hidden from the status lists whose only list is `name`: deleting it would leave them on no list at all. */
export function hiddenOrphans(members: Map<number, Member>, name: string): Member[] {
  return [...members.values()].filter((m) => m.hidden && m.lists.length === 1 && m.lists[0] === name);
}
