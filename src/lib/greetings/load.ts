import type { Catalogue } from "./types";

/** A language with its own greetings; every other one greets in English until its catalogue is written. */
export type GreetingLang = string;

/** The translated catalogues, each its own chunk, keyed by the file's language code. */
const LOCALES = import.meta.glob<{ default: Catalogue }>("./locales/*.ts");
const codeOf = (file: string) => file.slice("./locales/".length, -".ts".length);
const OWN = new Set(["en", "de", ...Object.keys(LOCALES).map(codeOf)]);

const loaded: Partial<Record<GreetingLang, Catalogue>> = {};
const pending: Partial<Record<GreetingLang, Promise<Catalogue>>> = {};

/** The UI language when it has greetings of its own, else English; German's regional tags greet in German. */
export const greetingLang = (language: string): GreetingLang =>
  OWN.has(language) ? language : language.startsWith("de") ? "de" : "en";

function importOf(lang: GreetingLang): Promise<{ default: Catalogue }> {
  if (lang === "de") return import("./de");
  if (lang === "en") return import("./en");
  return LOCALES[`./locales/${lang}.ts`]?.() ?? import("./en");
}

/** The catalogue once its chunk is in, so a mount after that picks before its first paint. */
export function loadedGreetings(lang: GreetingLang): Catalogue | undefined {
  return loaded[lang];
}

/** Starts the language's chunk once; a failed download may be tried again by the next call. */
export function loadGreetings(lang: GreetingLang): Promise<Catalogue> {
  pending[lang] ??= importOf(lang).then(
    (m) => (loaded[lang] = m.default),
    (e: unknown) => {
      delete pending[lang];
      throw e;
    },
  );
  return pending[lang];
}
