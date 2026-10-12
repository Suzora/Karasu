/** Which places need something the current profile lacks, so every way to navigate greys out the same ones. */

export type ProfileMode = "anilist" | "local" | "none";

/** `anilist` when the place needs an AniList account, `profile` when any profile will do, or null when it is open. */
export function navLock(to: string, mode: ProfileMode): "anilist" | "profile" | null {
  if ((to === "/social" || to === "/wrapped") && mode !== "anilist") return "anilist";
  if (to === "/stats" && mode === "none") return "profile";
  return null;
}
