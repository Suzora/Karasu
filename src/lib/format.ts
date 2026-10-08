import type { TFunction } from "i18next";

/** The closed format enum per medium; one definition, or the list and search filters drift. */
export const MEDIA_FORMATS = {
  ANIME: ["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC"],
  MANGA: ["MANGA", "NOVEL", "ONE_SHOT"],
} as const;

/** AniList media-format enum values we have explicit labels for. */
const KNOWN = new Set<string>([...MEDIA_FORMATS.ANIME, ...MEDIA_FORMATS.MANGA]);

/** Human-readable label for a media format; an unknown enum value is title-cased so it never leaks raw into the UI. */
export function formatLabel(
  format: string | null | undefined,
  t: TFunction,
): string {
  if (!format) return "";
  if (KNOWN.has(format)) return t(`format.${format}`);
  return titleCase(format);
}

/** `LIGHT_NOVEL` → "Light Novel". */
function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const KNOWN_STATUS = new Set([
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
]);

/** Airing/publishing status of the work, distinct from the user's list status under `status.*`. */
export function mediaStatusLabel(
  status: string | null | undefined,
  t: TFunction,
): string {
  if (!status) return "";
  if (KNOWN_STATUS.has(status)) return t(`mediaStatus.${status}`);
  return titleCase(status);
}

const KNOWN_SOURCE = new Set([
  "ORIGINAL",
  "MANGA",
  "LIGHT_NOVEL",
  "VISUAL_NOVEL",
  "VIDEO_GAME",
  "OTHER",
  "NOVEL",
  "DOUJINSHI",
  "ANIME",
  "WEB_NOVEL",
  "LIVE_ACTION",
  "GAME",
  "COMIC",
  "MULTIMEDIA_PROJECT",
  "PICTURE_BOOK",
]);

/** What the work was adapted from (`LIGHT_NOVEL` → "Light Novel"). */
export function sourceLabel(
  source: string | null | undefined,
  t: TFunction,
): string {
  if (!source) return "";
  if (KNOWN_SOURCE.has(source)) return t(`source.${source}`);
  return titleCase(source);
}

/** Manhwa/Manhua are `countryOfOrigin`, not formats; one list here so MediaList and Search spell them alike. */
export const ORIGINS = ["JP", "KR", "CN", "TW"] as const;

/** Literal switch, so `i18nKeys.test.ts` sees every key. */
export function originLabel(
  origin: (typeof ORIGINS)[number],
  t: (k: string) => string,
): string {
  switch (origin) {
    case "JP":
      return t("list.originJP");
    case "KR":
      return t("list.originKR");
    case "CN":
      return t("list.originCN");
    case "TW":
      return t("list.originTW");
  }
}

/** AniList fuzzy dates have independently-nullable parts. */
export function fuzzyDate(
  date: { year: number | null; month: number | null; day: number | null } | null,
  locale: string,
): string {
  if (!date?.year) return "";
  if (!date.month) return String(date.year);
  // Day 1 is a stand-in when the day is unknown; it is not displayed then.
  const d = new Date(date.year, date.month - 1, date.day ?? 1);
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    ...(date.day ? { day: "numeric" } : {}),
  });
}

/** A span of minutes in at most two units, as the reader's language writes them; a zero second unit is left off. */
export function durationText(minutes: number, t: TFunction): string {
  const total = Math.max(0, Math.round(minutes));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d > 0) return h > 0 ? t("time.dh", { d, h }) : t("time.d", { d });
  if (h > 0) return m > 0 ? t("time.hm", { h, m }) : t("time.h", { h });
  return t("time.m", { m });
}

/** A person's date, where a birthday without a year is normal and reads as day and month; otherwise `fuzzyDate`. */
export function personDate(
  date: { year: number | null; month: number | null; day: number | null } | null,
  locale: string,
): string {
  if (!date || date.year) return fuzzyDate(date, locale);
  if (!date.month || !date.day) return "";
  // 2000 is a leap year, so the 29th of February survives.
  return new Date(2000, date.month - 1, date.day).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

/** Coarse countdown to the next episode, at most two units: a glanceable value, not a ticking clock. */
export function countdown(secondsUntil: number, t: TFunction): string {
  if (secondsUntil <= 0) return "";
  // At least a minute, since an episode under a minute away is not airing "in 0 minutes".
  return durationText(Math.max(1, Math.floor(secondsUntil / 60)), t);
}

/** One fixed-digit formatter per locale and digit count, cached because constructing one costs more than formatting. */
const decimalFormats = new Map<string, Intl.NumberFormat>();

/** A number to a fixed count of decimals with the reader's separators: "1.700,5" in German, "1,700.5" in English. */
export function formatDecimal(n: number, locale: string, digits: number): string {
  const key = `${locale}:${digits}`;
  let f = decimalFormats.get(key);
  if (!f) {
    const options = { minimumFractionDigits: digits, maximumFractionDigits: digits };
    // An unrecognised tag throws rather than falling back, and the locale comes from the browser and a stored override.
    try {
      f = new Intl.NumberFormat(locale, options);
    } catch {
      f = new Intl.NumberFormat("en", options);
    }
    decimalFormats.set(key, f);
  }
  return f.format(n);
}

/** A difference with its sign written out, the minus as U+2212 rather than a hyphen; one that rounds to zero has none. */
export function formatSigned(n: number, locale: string, digits: number): string {
  const text = formatDecimal(Math.abs(n), locale, digits);
  if (Number(Math.abs(n).toFixed(digits)) === 0) return text;
  return `${n > 0 ? "+" : "\u2212"}${text}`;
}

/** A count short enough to sit above a chart column: exact below ten thousand, then thousands, then millions. */
export function compactCount(n: number, locale: string): string {
  if (!(n >= 10_000)) return String(n);
  if (n < 999_500) return `${Math.round(n / 1000)}k`;
  // Whole tenths first, so no value lands on a binary half; past ten million a decimal would make it five characters.
  const tenths = Math.round(n / 100_000);
  const millions = tenths < 100 ? tenths / 10 : Math.round(n / 1_000_000);
  return `${millions.toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
}
