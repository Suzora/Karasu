/** A status tab split into sections by tag or custom list: which entries fall where, and the rows the list draws. */

export type GroupBy = "" | "tag" | "list";
export const GROUP_KEYS: readonly GroupBy[] = ["", "tag", "list"];

export interface EntryGroup<E> {
  /** The tag (lower-cased) or the list's raw name; "" holds the entries that name none. */
  key: string;
  entries: E[];
}

export type GroupRow<E> =
  | { kind: "head"; group: EntryGroup<E>; open: boolean }
  | { kind: "cards"; group: EntryGroup<E>; entries: E[]; first: number };

/** An entry sits in every group it names, so a title with two tags shows twice; the groups follow `order`, unknowns after. */
export function groupEntries<E>(entries: E[], keysOf: (e: E) => string[], order: string[]): EntryGroup<E>[] {
  const byKey = new Map<string, E[]>();
  const rest: E[] = [];
  for (const e of entries) {
    const keys = [...new Set(keysOf(e))];
    if (keys.length === 0) rest.push(e);
    for (const k of keys) {
      const list = byKey.get(k);
      if (list) list.push(e);
      else byKey.set(k, [e]);
    }
  }
  const known = order.filter((k) => byKey.has(k));
  const unknown = [...byKey.keys()].filter((k) => !order.includes(k));
  const groups = [...known, ...unknown].map((key) => ({ key, entries: byKey.get(key) ?? [] }));
  return rest.length ? [...groups, { key: "", entries: rest }] : groups;
}

/** A head per group and, under an open one, its entries chunked by `columns`; `first` counts drawn entries only. */
export function groupRows<E>(groups: EntryGroup<E>[], folded: ReadonlySet<string>, columns: number): GroupRow<E>[] {
  const rows: GroupRow<E>[] = [];
  const step = Math.max(1, columns);
  let drawn = 0;
  for (const group of groups) {
    const open = !folded.has(group.key);
    rows.push({ kind: "head", group, open });
    if (!open) continue;
    for (let i = 0; i < group.entries.length; i += step) {
      rows.push({ kind: "cards", group, entries: group.entries.slice(i, i + step), first: drawn + i });
    }
    drawn += group.entries.length;
  }
  return rows;
}

/** The entries in drawn order, duplicates included, which is what the roving keyboard focus walks. */
export function drawnEntries<E>(rows: GroupRow<E>[]): E[] {
  return rows.flatMap((r) => (r.kind === "cards" ? r.entries : []));
}

/** The row holding drawn entry `index`, or null past the end. */
export function rowOfEntry<E>(rows: GroupRow<E>[], index: number): number | null {
  const at = rows.findIndex((r) => r.kind === "cards" && index >= r.first && index < r.first + r.entries.length);
  return at === -1 ? null : at;
}
