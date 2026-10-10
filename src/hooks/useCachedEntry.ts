import { useQuery } from "@tanstack/react-query";
import { fetchMediaList, isTauri } from "@/api/anilist";
import { useAuth } from "@/stores/auth";
import type { ListResult, MediaListEntry, MediaType } from "@/api/types";

/** One list as the query cache holds it; fetched in local mode only, so with an account this never costs a request. */
export function useCachedList(
  userId: number | undefined,
  type: MediaType | undefined,
): ListResult | undefined {
  const local = useAuth((s) => s.mode) === "local";
  const { data } = useQuery({
    queryKey: ["mediaList", type, userId],
    queryFn: () => fetchMediaList(userId as number, type as MediaType),
    enabled: local && isTauri && type !== undefined,
  });
  return data;
}

/** The list entry for one media; local mode must fetch, since AniList answers `null` for every local title. */
export function useCachedEntry(
  userId: number | undefined,
  type: MediaType | undefined,
  mediaId: number | undefined,
): MediaListEntry | null | undefined {
  const data = useCachedList(userId, type);
  if (!mediaId) return undefined;
  // `undefined` means the list has not loaded, `null` that it has and the title is not on it.
  if (!data) return undefined;
  return data.lists.flatMap((g) => g.entries).find((e) => e.mediaId === mediaId) ?? null;
}
