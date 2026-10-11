import { useQuery } from "@tanstack/react-query";
import { isTauri, syncStatus } from "@/api/anilist";
import type { SyncStatus } from "@/api/types";

/** Polls the sync state only while something shows it; keep `staleTime: 0`, a cached reading is the failure mode. */
export function useSyncStatus(open: boolean, intervalMs = 1_000) {
  return useQuery<SyncStatus>({
    queryKey: ["syncStatus"],
    queryFn: syncStatus,
    enabled: open && isTauri,
    refetchInterval: intervalMs,
    staleTime: 0,
    // A failed status read is a state to render, not one to retry into; the next tick tries again anyway.
    retry: false,
  });
}
