import { create } from "zustand";
import type { GroupBy } from "@/lib/listGroups";

/** What the open list lets the shell's menu do to it; null while no list is on screen. */
export interface ListPageHandle {
  group: GroupBy;
  setGroup: (group: GroupBy) => void;
  /** The stack a drawn card stands for, or null for an ordinary entry. */
  stackAt: (mediaId: number) => string | null;
  renameStack: (stackId: string) => void;
}

/** The bridge between the list page and the context menu, which lives in the shell and knows no page. */
export const useListPage = create<{ page: ListPageHandle | null; setPage: (page: ListPageHandle | null) => void }>(
  (set) => ({ page: null, setPage: (page) => set({ page }) }),
);
