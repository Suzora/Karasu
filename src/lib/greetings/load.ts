import type { Catalogue } from "./types";

export type GreetingLang = "de" | "en";

const loaded: Partial<Record<GreetingLang, Catalogue>> = {};
const pending: Partial<Record<GreetingLang, Promise<Catalogue>>> = {};

export const greetingLang = (language: string): GreetingLang => (language.startsWith("de") ? "de" : "en");

/** The catalogue once its chunk is in, so a mount after that picks before its first paint. */
export function loadedGreetings(lang: GreetingLang): Catalogue | undefined {
  return loaded[lang];
}

/** Starts the language's chunk once; a failed download may be tried again by the next call. */
export function loadGreetings(lang: GreetingLang): Promise<Catalogue> {
  pending[lang] ??= (lang === "de" ? import("./de") : import("./en")).then(
    (m) => (loaded[lang] = m.default),
    (e: unknown) => {
      delete pending[lang];
      throw e;
    },
  );
  return pending[lang];
}
