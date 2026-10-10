/** Where each history entry's scroller was left, so Back can return there; bounded, since most entries are never revisited. */
export const PLACE_LIMIT = 500;
const places = new Map<string, number>();

/** How long a restore keeps trying to reach a place the content is not yet tall enough to show. */
export const RESTORE_MS = 3000;

/** Frames the target must hold before a restore stops, since a measured row can still move it. */
const SETTLE_FRAMES = 2;

export function rememberPlace(key: string, place: number): void {
  places.delete(key);
  places.set(key, place);
  if (places.size > PLACE_LIMIT) places.delete(places.keys().next().value as string);
}

export function recallPlace(key: string): number | undefined {
  return places.get(key);
}

/** For tests: every remembered place goes. */
export function forgetPlaces(): void {
  places.clear();
}

/** For tests: how many places are remembered. */
export function placeCount(): number {
  return places.size;
}

/** One frame of a restore: where to scroll now, if anywhere, and whether the place has been reached and held. */
export function restoreStep(
  scrollTop: number,
  target: number | null,
  stable: number,
): { scrollTo: number | null; stable: number; done: boolean } {
  if (target === null) return { scrollTo: null, stable: 0, done: false };
  if (Math.abs(scrollTop - target) < 1) return { scrollTo: null, stable: stable + 1, done: stable + 1 >= SETTLE_FRAMES };
  return { scrollTo: target, stable: 0, done: false };
}

/** A row of a virtualized list as the virtualizer measures it. */
export interface MeasuredRow {
  index: number;
  start: number;
  size: number;
}

/** A virtualized list's place: the first entry of the row at the top plus how far into that row, so a layout keeps it. */
export function placeInRows(scrollTop: number, row: MeasuredRow | undefined, columns: number): number {
  if (!row) return 0;
  const into = row.size > 0 ? Math.min(0.999, Math.max(0, (scrollTop - row.start) / row.size)) : 0;
  return row.index * columns + into;
}

/** The row a place falls in at `columns` entries a row, and how far into that row. */
export function rowOfPlace(place: number, columns: number): { row: number; into: number } {
  const entry = Math.floor(place);
  return { row: Math.floor(entry / Math.max(1, columns)), into: place - entry };
}

/** The offset that shows a place, never past the furthest the scroller can go, so a list that came back shorter settles. */
export function offsetInRows(rowStart: number, rowSize: number, into: number, maxScroll: number): number {
  return Math.min(rowStart + into * rowSize, Math.max(0, maxScroll));
}

