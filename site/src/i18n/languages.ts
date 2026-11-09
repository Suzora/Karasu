/** Every language the site is published in, by its code in the URL and `<html lang>`, and its own name for itself. */
export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "fr-CA", name: "Français (Canada)" },
  { code: "es", name: "Español" },
  { code: "es-419", name: "Español (Latinoamérica)" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "cs", name: "Čeština" },
  { code: "sk", name: "Slovenčina" },
  { code: "hu", name: "Magyar" },
  { code: "ro", name: "Română" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "nb", name: "Norsk bokmål" },
  { code: "fi", name: "Suomi" },
  { code: "el", name: "Ελληνικά" },
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "bg", name: "Български" },
  { code: "hr", name: "Hrvatski" },
  { code: "sr-Latn", name: "Srpski" },
  { code: "sl", name: "Slovenščina" },
  { code: "tr", name: "Türkçe" },
  { code: "lt", name: "Lietuvių" },
  { code: "lv", name: "Latviešu" },
  { code: "et", name: "Eesti" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh-Hans", name: "简体中文" },
  { code: "zh-Hant", name: "繁體中文" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ไทย" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "fil", name: "Filipino" },
  { code: "hi", name: "हिन्दी" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

/** The two languages written by people; every other catalog is an unreviewed AI translation. */
export const HUMAN_LANGUAGES: readonly Lang[] = ["en", "de"];

/** The page's path below the site's base: English at the root, every other language in a folder of its code. */
export const langPath = (lang: Lang) => (lang === "en" ? "" : `${lang}/`);
