import { contrastRatio, mix } from "./contrast";

/** The colours a tag can take; each is a `--color-tag-<name>` token with a light twin, so a theme never picks hex. */
export const TAG_COLOURS = ["rose", "amber", "lime", "teal", "sky", "violet", "pink", "slate"] as const;
export type TagColour = (typeof TAG_COLOURS)[number];

/** A palette name, or a `#rrggbb` the user picked. */
export type TagColourValue = TagColour | `#${string}`;

/** A tag's colour by its lower-cased name, kept per device; the notes carry tags, never their colours. */
export type TagColourMap = Record<string, TagColourValue>;

const HEX = /^#[0-9a-f]{6}$/i;

export const isCustom = (v: string): v is `#${string}` => HEX.test(v);

const isColour = (v: unknown): v is TagColourValue =>
  typeof v === "string" && ((TAG_COLOURS as readonly string[]).includes(v) || isCustom(v));

/** The chip a dot sits on, per theme; a custom colour is lifted off it the way the palette was chosen to be. */
const CHIP: Record<"dark" | "light", string> = { dark: "#1f232b", light: "#e5e8ed" };

/** A picked colour moved toward white on dark or black on light until its dot reads 3:1 against the chip. */
export function readableDot(hex: string, theme: "dark" | "light"): string {
  const away = theme === "dark" ? "#ffffff" : "#000000";
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(hex, away, step / 20);
    if (contrastRatio(candidate, CHIP[theme]) >= 3) return candidate;
  }
  return away;
}

/** Stored JSON back to a map, dropping anything the palette does not know rather than failing the whole read. */
export function parseTagColours(raw: string | null): TagColourMap {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, v]) => isColour(v))
        .map(([k, v]) => [k, (v as string).toLowerCase()]),
    ) as TagColourMap;
  } catch {
    return {};
  }
}

export function colourOf(map: TagColourMap, tag: string): TagColourValue | null {
  return map[tag.toLowerCase()] ?? null;
}

/** The map with one tag's colour set, or removed when `colour` is null. */
export function setColour(map: TagColourMap, tag: string, colour: TagColourValue | null): TagColourMap {
  const key = tag.toLowerCase();
  const { [key]: _, ...rest } = map;
  return colour ? { ...rest, [key]: colour.toLowerCase() as TagColourValue } : rest;
}
