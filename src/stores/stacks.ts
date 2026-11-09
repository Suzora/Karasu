import { create } from "zustand";
import { parseStacks, type Stack, type StackStore } from "@/lib/stacks";

const STORAGE_KEY = "karasu-stacks";

function stored(): StackStore {
  try {
    return parseStacks(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

interface StacksState {
  stacks: StackStore;
  /** Replaces one media type's stacks with what a `lib/stacks` change returned. */
  update: (type: string, change: (stacks: Stack[]) => Stack[]) => void;
}

const NONE: Stack[] = [];

/** The stacks on this device per media type; one store, so every list and the sheet read the same ones. */
export const useStacks = create<StacksState>((set, get) => ({
  stacks: stored(),
  update: (type, change) => {
    const stacks = { ...get().stacks, [type]: change(get().stacks[type] ?? NONE) };
    set({ stacks });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stacks));
    } catch {
      // A storage that refuses keeps the stacks for this session alone.
    }
  },
}));

/** One media type's stacks, the same empty array when there are none so a selector stays stable. */
export const useTypeStacks = (type: string) => useStacks((s) => s.stacks[type] ?? NONE);
