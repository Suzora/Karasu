/** Which spelling of a title Karasu shows first, and the order it falls back through when that one is missing. */
import type { MediaTitle } from "@/api/types";

export const TITLE_LANGUAGES = ["english", "romaji", "native"] as const;
export type TitleLanguage = (typeof TITLE_LANGUAGES)[number];

/** English first is what every screen showed before the setting existed. */
export const DEFAULT_TITLE_LANGUAGE: TitleLanguage = "english";

/** Anything stored that is not one of the three reads as the default, so a damaged key never blanks a title. */
export function parseTitleLanguage(raw: unknown): TitleLanguage {
  return (TITLE_LANGUAGES as readonly unknown[]).includes(raw) ? (raw as TitleLanguage) : DEFAULT_TITLE_LANGUAGE;
}

const ORDER: Record<TitleLanguage, readonly (keyof MediaTitle)[]> = {
  english: ["english", "romaji", "native"],
  romaji: ["romaji", "english", "native"],
  native: ["native", "romaji", "english"],
};

const present = (s: string | null | undefined): s is string => !!s && s.trim() !== "";

/** The title in the chosen language, else the next one AniList has; a blank variant counts as missing. */
export function pickTitle(title: MediaTitle, lang: TitleLanguage): string {
  for (const key of ORDER[lang]) {
    const value = title[key];
    if (present(value)) return value;
  }
  return "?";
}

/** Whether `text` is the native spelling, which takes the Japanese face wherever it is drawn. */
export function isNativeLine(title: MediaTitle | null | undefined, text: string): boolean {
  const native = title?.native?.trim();
  return !!native && native === text.trim();
}

/** Whether a string carries kana, kanji or hangul, for a canvas that must pick the Japanese face from the text alone. */
export function needsJapaneseFace(text: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uff66-\uff9f]/.test(text);
}

/** The line under a shown title: the native one unless it is already shown, else the romaji unless that is. */
export function secondLine(
  title: MediaTitle | null | undefined,
  main: string,
): { text: string; native: boolean } | null {
  const shown = main.trim();
  const native = title?.native?.trim();
  if (native && native !== shown) return { text: native, native: true };
  const romaji = title?.romaji?.trim();
  if (romaji && romaji !== shown) return { text: romaji, native: false };
  return null;
}

/** Shown in the setting's example when the list has nothing better: every variant exists and each differs. */
export const SAMPLE_TITLE: MediaTitle = {
  english: "Frieren: Beyond Journey’s End",
  romaji: "Sousou no Frieren",
  native: "葬送のフリーレン",
};

/** The most telling example: the first title with three distinct variants, else any title, else the sample. */
export function exampleTitle(titles: readonly MediaTitle[]): MediaTitle {
  const telling = titles.find((t) => {
    const parts = [t.english, t.romaji, t.native];
    return parts.every(present) && new Set(parts.map((p) => p!.trim())).size === 3;
  });
  return telling ?? titles[0] ?? SAMPLE_TITLE;
}

let active: TitleLanguage = DEFAULT_TITLE_LANGUAGE;

/** The language `displayTitle` uses when a caller names none; the title-language store keeps it current. */
export const activeTitleLanguage = (): TitleLanguage => active;

export function setActiveTitleLanguage(lang: TitleLanguage): void {
  active = lang;
}
