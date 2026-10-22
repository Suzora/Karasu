/** A voice actor's roles grouped by the year their title started; `null` is a title that has no date yet. */
export interface RoleYear<T> {
  year: number | null;
  roles: T[];
}

interface Dated {
  id: number;
  node: { startDate: { year: number | null } | null } | null;
}

/** The pages loaded so far by year, newest first with the undated ahead, minus a repeated edge or one without a title. */
export function rolesByYear<T extends Dated>(pages: T[][]): RoleYear<T>[] {
  const seen = new Set<number>();
  const byYear = new Map<number | null, T[]>();
  for (const page of pages) {
    for (const edge of page) {
      if (!edge.node || seen.has(edge.id)) continue;
      seen.add(edge.id);
      const year = edge.node.startDate?.year ?? null;
      const group = byYear.get(year);
      if (group) group.push(edge);
      else byYear.set(year, [edge]);
    }
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => (a === null ? -1 : b === null ? 1 : b - a))
    .map(([year, roles]) => ({ year, roles }));
}
