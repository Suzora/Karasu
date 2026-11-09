/** Stacks: entries of one list laid on each other by hand, kept per device because AniList has no field for them. */

export interface Stack {
  id: string;
  /** Media ids in the order the stack shows them. */
  members: number[];
}

export type StackStore = Record<string, Stack[]>;

/** Stacks are only stacks with two members or more; anything thinner is dropped wherever a change leaves one. */
const keep = (stacks: Stack[]) => stacks.filter((s) => s.members.length >= 2);

/** A new stack of `ids`, each taken out of the stack it sat in, since an entry belongs to one stack at most. */
export function makeStack(stacks: Stack[], ids: number[], id: string): Stack[] {
  const members = [...new Set(ids)];
  const taken = new Set(members);
  const rest = stacks.map((s) => ({ ...s, members: s.members.filter((m) => !taken.has(m)) }));
  return keep(members.length >= 2 ? [...rest, { id, members }] : rest);
}

export function removeMember(stacks: Stack[], id: string, mediaId: number): Stack[] {
  return keep(stacks.map((s) => (s.id === id ? { ...s, members: s.members.filter((m) => m !== mediaId) } : s)));
}

export function dissolveStack(stacks: Stack[], id: string): Stack[] {
  return stacks.filter((s) => s.id !== id);
}

/** One place up (-1) or down (1); a move past either end changes nothing. */
export function moveMember(stacks: Stack[], id: string, mediaId: number, by: -1 | 1): Stack[] {
  return stacks.map((s) => {
    if (s.id !== id) return s;
    const at = s.members.indexOf(mediaId);
    const to = at + by;
    if (at === -1 || to < 0 || to >= s.members.length) return s;
    const members = [...s.members];
    [members[at], members[to]] = [members[to], members[at]];
    return { ...s, members };
  });
}

export interface ShownStack<E> {
  stack: Stack;
  /** The members this list holds, in the stack's order. */
  members: E[];
}

/** The list with each stack drawn once, where its first member stands; `stackOf` is keyed by that drawn entry. */
export function collapseStacks<E extends { mediaId: number }>(
  entries: E[],
  stacks: Stack[],
): { items: E[]; stackOf: Map<number, ShownStack<E>> } {
  const byId = new Map(entries.map((e) => [e.mediaId, e]));
  const stackOf = new Map<number, ShownStack<E>>();
  const hidden = new Set<number>();
  for (const stack of stacks) {
    const members = stack.members.map((m) => byId.get(m)).filter((e): e is E => e !== undefined);
    if (members.length < 2) continue;
    const ids = new Set(members.map((m) => m.mediaId));
    const lead = entries.find((e) => ids.has(e.mediaId));
    if (!lead) continue;
    stackOf.set(lead.mediaId, { stack, members });
    for (const m of ids) if (m !== lead.mediaId) hidden.add(m);
  }
  if (hidden.size === 0) return { items: entries, stackOf };
  return { items: entries.filter((e) => !hidden.has(e.mediaId)), stackOf };
}

const isStack = (v: unknown): v is Stack =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as Stack).id === "string" &&
  Array.isArray((v as Stack).members) &&
  (v as Stack).members.every((m) => Number.isInteger(m));

/** The stored stacks per media type; anything malformed is dropped rather than trusted. */
export function parseStacks(raw: string | null): StackStore {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: StackStore = {};
    for (const [type, list] of Object.entries(parsed)) {
      if (Array.isArray(list)) out[type] = keep(list.filter(isStack));
    }
    return out;
  } catch {
    return {};
  }
}
