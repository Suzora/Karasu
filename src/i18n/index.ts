import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { commands, unwrap } from "@/api/tauri";
import { LANGUAGES, isLanguageCode, matchSystemLanguage } from "@/lib/languages";
import type { PartialLocale } from "./types";

// Not dead: `i18nKeys.test.ts` reaches it as a property of the module object, which a grep for the import misses.
export { en };

/** English is primary; the app follows the system language until the Settings dropdown overrides it in localStorage. */

export type LanguageSetting = "system" | string;
const STORAGE_KEY = "karasu-lang";

/** Each machine-translated language is its own chunk, fetched the first time it is shown. */
const LOCALES = import.meta.glob<{ default: PartialLocale }>("./locales/*.ts");
const hasLocale = (code: string) => code === "en" || code === "de" || `./locales/${code}.ts` in LOCALES;

/** Only the languages with a file of their own; one listed before its translation lands would read as English. */
export const SUPPORTED_LANGUAGES: { value: LanguageSetting; label: string }[] = [
  { value: "system", label: "System" },
  ...LANGUAGES.filter((l) => hasLocale(l.code)).map((l) => ({ value: l.code, label: l.endonym })),
];

export function getLanguageSetting(): LanguageSetting {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isLanguageCode(stored) && hasLocale(stored) ? stored : "system";
}

/** The system's language when Karasu has it written, else the first language it falls back to that is. */
function systemLanguage(): string {
  const wanted = matchSystemLanguage(navigator.languages?.length ? navigator.languages : [navigator.language ?? "en"]);
  return [wanted, ...(FALLBACK[wanted] ?? [])].find(hasLocale) ?? "en";
}

export function resolveLanguage(setting: LanguageSetting): string {
  return setting === "system" ? systemLanguage() : setting;
}

/** A regional variant falls back to its parent before English, so a gap in pt-BR reads Portuguese, not English. */
export const FALLBACK: Record<string, string[]> = {
  "pt-BR": ["pt", "en"],
  "es-419": ["es", "en"],
  "fr-CA": ["fr", "en"],
  default: ["en"],
};

/** Loads a language and the ones it falls back to; English stays in the entry chunk, German is its own typed file. */
async function ensureBundle(lng: string): Promise<void> {
  for (const code of [lng, ...(FALLBACK[lng] ?? [])]) {
    if (code === "en" || i18n.hasResourceBundle(code, "translation")) continue;
    if (code === "de") {
      const { de } = await import("./de");
      i18n.addResourceBundle(code, "translation", de);
      continue;
    }
    const load = LOCALES[`./locales/${code}.ts`];
    if (load) i18n.addResourceBundle(code, "translation", (await load()).default);
  }
}

export async function setLanguageSetting(setting: LanguageSetting) {
  if (setting === "system") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, setting);
  }
  const lng = resolveLanguage(setting);
  // Before the switch, or the UI would render the keys it has not got yet.
  await ensureBundle(lng);
  await i18n.changeLanguage(lng);
}

/** Resolved before the entry's first render, so a German start does not paint English for a frame and swap. */
export async function initLanguage(): Promise<void> {
  await ensureBundle(resolveLanguage(getLanguageSetting()));
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: resolveLanguage(getLanguageSetting()),
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false },
});

/** Mirrors the language into SQLite for Rust's notifications and tray menu; fire-and-forget, it is only a copy. */
function mirrorToBackend(lng: string) {
  if (!("__TAURI_INTERNALS__" in window)) return;
  void unwrap(commands.setUiLanguage(lng)).catch(() => {});
}

/** Keeps `<html lang>` on the rendered language, which screen readers and the WebView's spell-check read from. */
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
  mirrorToBackend(lng);
});
if (typeof document !== "undefined") {
  const lng = resolveLanguage(getLanguageSetting());
  document.documentElement.lang = lng;
  // On start too: `languageChanged` does not fire for the language `init` was given, and "system" can resolve anew.
  mirrorToBackend(lng);
}

export default i18n;
