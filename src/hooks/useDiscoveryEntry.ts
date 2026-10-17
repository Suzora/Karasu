import { useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveListEntry } from "@/api/anilist";
import type { SaveEntryInput } from "@/api/types";
import type { MediaWithListStatus } from "@/api/queries";
import { useCachedList } from "@/hooks/useCachedEntry";
import { useListMutations } from "@/hooks/useListMutations";
import { cardEntry, noteAdded, stubFromSave, subscribeTold, toldEntry } from "@/lib/sessionEntries";
import { withCompletion } from "@/lib/completion";
import { useAuth } from "@/stores/auth";

/** A discovery card's entry and its one write path: the cached list first, then this session's word, then the stub. */
export function useDiscoveryEntry(media: MediaWithListStatus) {
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  const hasProfile = viewer !== null || mode === "local";
  const qc = useQueryClient();
  const userId = viewer?.id ?? 0;

  // The viewer's own list, read and never fetched with an account: every in-app write keeps it in step, the response not.
  const list = useCachedList(userId, media.type);
  const listed = list?.lists.flatMap((g) => g.entries).find((e) => e.mediaId === media.id);
  const said = useSyncExternalStore(subscribeTold, () => toldEntry(userId, media.id));
  const entry = cardEntry(listed, said, media.mediaListEntry);
  const { save } = useListMutations(userId, media.type);

  // A first add goes out with the media object, which a new local entry needs and the list hook's save does not carry.
  const add = useMutation({
    mutationFn: (input: SaveEntryInput) => saveListEntry(input, media),
    onSuccess: (result, input) => {
      // Only this card's collection: saving an anime cannot change the manga list, and the broad key refetched both.
      qc.invalidateQueries({ queryKey: ["mediaList", media.type] });
      noteAdded(userId, media.id, stubFromSave(input, result.entry));
    },
  });

  // A listed title goes through the list's own hook, which patches the list, receipts the write and offers Undo.
  const send = (input: SaveEntryInput) => {
    if (listed) save.mutate(input);
    // Filled before `mutate`, so the entry remembered from the variables shows the totals the write carried.
    else add.mutate(withCompletion(input, media, media.type, entry?.status ?? null));
  };

  return { entry, send, busy: add.isPending || save.isPending, hasProfile };
}
