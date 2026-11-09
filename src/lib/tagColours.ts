/** The colours a tag can take; each is a `--color-tag-<name>` token with a light twin, so a theme never picks hex. */
export const TAG_COLOURS = ["rose", "amber", "lime", "teal", "sky", "violet", "pink", "slate"] as const;
export type TagColour = (typeof TAG_COLOURS)[number];

/** A tag's colour by its lower-cased name, kept per device; the notes carry tags, never their colours. */
export type TagColourMap = Record<string, TagColour>;

const isColour = (v: unknown): v is TagColour => (TAG_COLOURS as readonly unknown[]).includes(v);

/** Stored JSON back to a map, dropping anything the palette does not know rather than failing the whole read. */
export function parseTagColours(raw: string | null): TagColourMap {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => isColour(v))) as TagColourMap;
  } catch {
    return {};
  }
}

export function colourOf(map: TagColourMap, tag: string): TagColour | null {
  return map[tag.toLowerCase()] ?? null;
}

/** The map with one tag's colour set, or removed when `colour` is null. */
export function setColour(map: TagColourMap, tag: string, colour: TagColour | null): TagColourMap {
  const key = tag.toLowerCase();
  const { [key]: _, ...rest } = map;
  return colour ? { ...rest, [key]: colour } : rest;
}
