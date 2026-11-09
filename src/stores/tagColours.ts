import { create } from "zustand";
import { parseTagColours, setColour, type TagColourMap, type TagColourValue } from "@/lib/tagColours";

const STORAGE_KEY = "karasu-tag-colours";

function stored(): TagColourMap {
  try {
    return parseTagColours(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
}

interface TagColoursState {
  colours: TagColourMap;
  setColour: (tag: string, colour: TagColourValue | null) => void;
}

/** Each tag's colour on this device; one store, so a change repaints every chip at once. */
export const useTagColours = create<TagColoursState>((set, get) => ({
  colours: stored(),
  setColour: (tag, colour) => {
    const colours = setColour(get().colours, tag, colour);
    set({ colours });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(colours));
    } catch {
      // A storage that refuses keeps the colour for this session alone.
    }
  },
}));
