import type { TFunction } from "i18next";
import { durationText } from "./format";

/** Remaining watch time in minutes for an anime entry, or null if unknown. */
export function remainingMinutes(
  media: { episodes: number | null; duration?: number | null },
  progress: number,
): number | null {
  const episodes = media.episodes;
  const duration = media.duration ?? null;
  if (episodes == null || duration == null) return null;
  return Math.max(0, episodes - progress) * duration;
}

/** What is left to watch as a duration ("3d 4h" / "12h 30m" / "45m"), or the word for nothing left. */
export function formatMinutes(total: number, t: TFunction): string {
  if (total <= 0) return t("time.none");
  return durationText(total, t);
}
