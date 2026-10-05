import { create } from "zustand";
import { commands, unwrap } from "@/api/tauri";
import {
  DEFAULT_TITLE_LANGUAGE,
  parseTitleLanguage,
  setActiveTitleLanguage,
  type TitleLanguage,
} from "@/lib/titleLanguage";

const STORAGE_KEY = "karasu-title-language";

function stored(): TitleLanguage {
  try {
    return parseTitleLanguage(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_TITLE_LANGUAGE;
  }
}

/** Mirrors the choice into kv for the titles Rust spells; fire-and-forget, it is only a copy. */
function mirrorToBackend(language: TitleLanguage) {
  if (!("__TAURI_INTERNALS__" in window)) return;
  void unwrap(commands.setTitleLanguage(language)).catch(() => {});
}

// Set on import, so whichever entry loads this module first spells titles right before anything renders.
const initial = stored();
setActiveTitleLanguage(initial);

interface TitleLanguageState {
  language: TitleLanguage;
  /** Re-reads the stored choice and hands it to Rust; run once at start, before the first render. */
  init: () => void;
  setLanguage: (language: TitleLanguage) => void;
}

/** Per device, like the theme; `displayTitle` reads the active copy, and a surface that stays mounted subscribes here. */
export const useTitleLanguage = create<TitleLanguageState>((set) => ({
  language: initial,
  init: () => {
    const language = stored();
    setActiveTitleLanguage(language);
    set({ language });
    // On start too: Rust may hold an older copy, or none on a first run.
    mirrorToBackend(language);
  },
  setLanguage: (language) => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Private-mode storage throws on write; the choice still holds until the window closes.
    }
    setActiveTitleLanguage(language);
    set({ language });
    mirrorToBackend(language);
  },
}));
