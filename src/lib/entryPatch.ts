/** The single write each control of the entry dialog makes, since that dialog saves every field as it is touched. */

import type { FuzzyDate, MediaListStatus, MediaType, SaveEntryInput } from "@/api/types";
import { toAdvancedArray } from "@/lib/advancedScores";
import { chooseStatus, type CompletionMedia, type FillMemo, type StatusFields } from "@/lib/completion";

export type EntryPatch = Omit<SaveEntryInput, "mediaId">;

/** A status tile's write: the status plus whatever completing moved, and volumes only for manga. */
export function statusPatch(
  fields: StatusFields,
  memo: FillMemo | null,
  next: MediaListStatus,
  media: CompletionMedia,
  mediaType?: MediaType,
): { patch: EntryPatch; fields: StatusFields; memo: FillMemo | null } {
  const picked = chooseStatus(fields, memo, next, media, mediaType);
  const patch: EntryPatch = { status: picked.fields.status };
  if (picked.fields.progress !== fields.progress) patch.progress = picked.fields.progress;
  const manga = (mediaType ?? media.type) === "MANGA";
  if (manga && picked.fields.volumes !== fields.volumes) patch.progressVolumes = picked.fields.volumes;
  return { patch, fields: picked.fields, memo: picked.memo };
}

/** What AniList takes to clear a fuzzy date: every part null. */
const CLEARED_DATE: FuzzyDate = { year: null, month: null, day: null };

export function datePatch(which: "startedAt" | "completedAt", value: FuzzyDate | null): EntryPatch {
  return { [which]: value ?? CLEARED_DATE };
}

/** The write replaces the whole membership, so every list the entry is on goes out, in the account's order. */
export function listsPatch(names: readonly string[], members: ReadonlySet<string>): EntryPatch {
  return { customLists: names.filter((n) => members.has(n)) };
}

/** Hidden-from-status-lists exists on AniList only; the local schema stores privacy and not the other. */
export function flagPatch(
  anilist: boolean,
  flag: "private" | "hiddenFromStatusLists",
  value: boolean,
): EntryPatch | null {
  if (flag === "hiddenFromStatusLists" && !anilist) return null;
  return { [flag]: value };
}

/** Positional, so built from the account's category order; nothing at all for an account without categories. */
export function advancedPatch(categories: string[], values: Record<string, number>): EntryPatch | null {
  if (categories.length === 0) return null;
  return { advancedScores: toAdvancedArray(categories, values) };
}
