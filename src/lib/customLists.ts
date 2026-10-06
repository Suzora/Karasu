import type { MediaListGroup } from "@/api/types";

/** Custom-list names from the raw `customLists` keys, never the display name `g.name` AniList re-spells. */
export function customListNames(groups: MediaListGroup[]): string[] {
  const names = new Set<string>();
  for (const group of groups) {
    for (const entry of group.entries) {
      for (const name of Object.keys(entry.customLists ?? {})) names.add(name);
    }
  }
  // Sorted for a stable dropdown; the raw name is shown as the user typed it, not as the site capitalises it.
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** An entry's membership map after a save of `checked`: every list it knew stays a key, so no list drops out of sight. */
export function membership(old: Record<string, boolean> | null | undefined, checked: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const name of Object.keys(old ?? {})) out[name] = false;
  for (const name of checked) out[name] = true;
  return out;
}
