import { create } from "zustand";

/** Whether the Overview's rail is drawing the detected title, so the floating detection window can step back. */
export const useOverviewRail = create<{ showsDetection: boolean; set: (v: boolean) => void }>((set) => ({
  showsDetection: false,
  set: (v) => set({ showsDetection: v }),
}));
