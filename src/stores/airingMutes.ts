import { create } from "zustand";
import { getAiringNotify, isTauri, listAiringMutes, setAiringMute, type AiringMute } from "@/api/anilist";

interface AiringMutesState {
  /** In the order Rust lists them and then mute order; the Settings list sorts by the spelling it shows. */
  mutes: AiringMute[];
  /** The same ids as a set, for the action resolver's per-entry check. */
  ids: ReadonlySet<number>;
  /** The new-episode switch, mirrored here because a mute only applies while it is on. */
  notify: boolean;
  /** Why the last change did not stick, or null. */
  error: string | null;
  init: () => Promise<void>;
  setMuted: (mediaId: number, title: string, muted: boolean) => Promise<void>;
}

const idsOf = (mutes: AiringMute[]): ReadonlySet<number> => new Set(mutes.map((m) => m.mediaId));

/** The titles whose new episodes Karasu keeps quiet about; a device setting, so it survives an account change. */
export const useAiringMutes = create<AiringMutesState>((set, get) => ({
  mutes: [],
  ids: new Set(),
  notify: true,
  error: null,

  init: async () => {
    if (!isTauri) return;
    try {
      const [mutes, notify] = await Promise.all([listAiringMutes(), getAiringNotify()]);
      set({ mutes, ids: idsOf(mutes), notify });
    } catch {
      // Nothing muted is the safe reading: a toast too many beats a silence the user never asked for.
    }
  },

  /** Paints, then persists, and undoes only this title's change if persisting fails. */
  setMuted: async (mediaId, title, muted) => {
    const without = (list: AiringMute[]) => list.filter((m) => m.mediaId !== mediaId);
    const before = get().mutes.find((m) => m.mediaId === mediaId) ?? null;
    const next = muted ? [...without(get().mutes), { mediaId, title }] : without(get().mutes);
    set({ mutes: next, ids: idsOf(next), error: null });
    if (!isTauri) return;
    try {
      await setAiringMute(mediaId, title, muted);
    } catch (e) {
      const undone = before ? [...without(get().mutes), before] : without(get().mutes);
      set({ mutes: undone, ids: idsOf(undone), error: String(e) });
    }
  },
}));
