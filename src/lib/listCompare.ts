import type { MediaListStatus } from "@/api/types";
import { affinity, type AffinityResult } from "@/lib/affinity";

/** One entry of either list, its score already raw (0–100, 0 unscored), so two score formats compare. */
export interface CompareEntry {
  mediaId: number;
  raw: number;
  status: MediaListStatus;
}

export interface ListComparison extends AffinityResult {
  /** Mean raw score over the titles both scored, per side; null when there are none. */
  meanMine: number | null;
  meanTheirs: number | null;
  /** Titles both have finished, a rewatch counting as finished. */
  bothCompleted: number;
  /** Titles they finished and scored that the viewer has not seen or only plans, their best first. */
  theyRatedUnseen: { mediaId: number; theirsRaw: number }[];
}

const FINISHED = new Set<MediaListStatus>(["COMPLETED", "REPEATING"]);

/** The first entry per title, since a custom list echoes entries the status lists already carry. */
function byMedia(entries: CompareEntry[]): Map<number, CompareEntry> {
  const out = new Map<number, CompareEntry>();
  for (const e of entries) if (!out.has(e.mediaId)) out.set(e.mediaId, e);
  return out;
}

/** The viewer's list against another user's, on ids alone; the caller filters both and spells the titles. */
export function compareLists(
  mine: CompareEntry[],
  theirs: CompareEntry[],
  { top = 5, picks = 8 }: { top?: number; picks?: number } = {},
): ListComparison {
  const base = affinity(mine, theirs, top);
  const mineBy = byMedia(mine);
  const theirsBy = byMedia(theirs);

  let sumMine = 0;
  let sumTheirs = 0;
  let scored = 0;
  let bothCompleted = 0;
  const unseen: { mediaId: number; theirsRaw: number }[] = [];
  for (const t of theirsBy.values()) {
    const m = mineBy.get(t.mediaId);
    if (m && m.raw > 0 && t.raw > 0) {
      sumMine += m.raw;
      sumTheirs += t.raw;
      scored += 1;
    }
    if (m && FINISHED.has(m.status) && FINISHED.has(t.status)) bothCompleted += 1;
    if (FINISHED.has(t.status) && t.raw > 0 && (!m || m.status === "PLANNING")) {
      unseen.push({ mediaId: t.mediaId, theirsRaw: t.raw });
    }
  }
  unseen.sort((a, b) => b.theirsRaw - a.theirsRaw || a.mediaId - b.mediaId);

  return {
    ...base,
    meanMine: scored ? sumMine / scored : null,
    meanTheirs: scored ? sumTheirs / scored : null,
    bothCompleted,
    theyRatedUnseen: unseen.slice(0, picks),
  };
}
