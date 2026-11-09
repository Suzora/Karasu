/** Every language Karasu speaks, and which one a system's preferences resolve to. */

export interface Language {
  /** The i18next code, which is also the file name under `src/i18n/locales` and `src/i18n/native`. */
  code: string;
  /** The language's own name for itself, as the picker shows it. */
  endonym: string;
  /** Google Play's and F-Droid's folder name under `fastlane/metadata/android`. */
  fastlane: string;
  /** Written and kept whole by hand; the rest are machine translations with English filling any gap. */
  complete: boolean;
}

/** Its own name, from Intl, with the first letter raised the way a picker lists it. */
function endonym(code: string): string {
  const name = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
}

const lang = (code: string, fastlane: string, complete = false): Language => ({ code, endonym: endonym(code), fastlane, complete });

export const LANGUAGES: readonly Language[] = [
  lang("en", "en-US", true),
  lang("de", "de-DE", true),
  lang("fr", "fr-FR"),
  lang("fr-CA", "fr-CA"),
  lang("es", "es-ES"),
  lang("es-419", "es-419"),
  lang("it", "it-IT"),
  lang("pt", "pt-PT"),
  lang("pt-BR", "pt-BR"),
  lang("nl", "nl-NL"),
  lang("pl", "pl-PL"),
  lang("cs", "cs-CZ"),
  lang("sk", "sk"),
  lang("hu", "hu-HU"),
  lang("ro", "ro"),
  lang("sv", "sv-SE"),
  lang("da", "da-DK"),
  lang("nb", "no-NO"),
  lang("fi", "fi-FI"),
  lang("el", "el-GR"),
  lang("ru", "ru-RU"),
  lang("uk", "uk"),
  lang("bg", "bg"),
  lang("hr", "hr"),
  lang("sr", "sr"),
  lang("sl", "sl"),
  lang("tr", "tr-TR"),
  lang("lt", "lt"),
  lang("lv", "lv"),
  lang("et", "et"),
  lang("ja", "ja-JP"),
  lang("ko", "ko-KR"),
  lang("zh-Hans", "zh-CN"),
  lang("zh-Hant", "zh-TW"),
  lang("vi", "vi"),
  lang("th", "th"),
  lang("id", "id"),
  lang("ms", "ms"),
  lang("fil", "fil"),
  lang("hi", "hi-IN"),
];

const CODES = new Set(LANGUAGES.map((l) => l.code));

export const isLanguageCode = (code: string): boolean => CODES.has(code);

/** Chinese splits by script, which a region implies; Taiwan, Hong Kong and Macau write the traditional one. */
const TRADITIONAL = new Set(["TW", "HK", "MO"]);

/** One preference tag to a code Karasu has, or null; the regional variants pick themselves before their parent. */
function matchOne(tag: string): string | null {
  let locale: Intl.Locale;
  try {
    locale = new Intl.Locale(tag);
  } catch {
    return null;
  }
  const { language, script, region } = locale;
  if (language === "zh") return script === "Hant" || (region && TRADITIONAL.has(region)) ? "zh-Hant" : "zh-Hans";
  if (language === "pt") return region === "BR" ? "pt-BR" : "pt";
  if (language === "es") return !region || region === "ES" ? "es" : "es-419";
  if (language === "fr") return region === "CA" ? "fr-CA" : "fr";
  if (language === "no" || language === "nn" || language === "nb") return "nb";
  if (language === "tl" || language === "fil") return "fil";
  return CODES.has(language) ? language : null;
}

/** The first of the system's preferences Karasu speaks, else English. */
export function matchSystemLanguage(preferences: readonly string[]): string {
  for (const tag of preferences) {
    const found = matchOne(tag);
    if (found) return found;
  }
  return "en";
}
