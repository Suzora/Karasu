export type LibrarySection = "ready" | "done" | "offList" | "unplaced";
const ORDER: LibrarySection[] = ["ready", "done", "offList", "unplaced"];

/** The column's jump marks in the page's reading order; a section with nothing in it has nothing to jump to. */
export function libraryJumps(counts: Record<LibrarySection, number>): { id: LibrarySection; count: number }[] {
  return ORDER.filter((id) => counts[id] > 0).map((id) => ({ id, count: counts[id] }));
}
