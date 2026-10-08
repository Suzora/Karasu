import { PURE_INK, readableInk } from "@/lib/contrast";

/** The categorical ramp for groups with no meaning; graph-none never sits beside surface-600, its near twin. */
export const TONES = [
  "var(--color-accent-500)",
  "var(--color-accent-400)",
  "var(--color-surface-600)",
  "var(--color-surface-700)",
  "color-mix(in oklab, var(--color-accent-500) 50%, var(--color-surface-900))",
  "var(--color-graph-none)",
];

/** Ink over `TONES[i]`; keep the bare `i`, later treemap tiles fade to grey where accent ink vanishes. */
export const onAccent = (i: number) => (i < 2 ? "fill-accent-ink" : "fill-ink-300");

/** A fill class for text on a fill of `hex`, from the two inks that stay fixed while the theme flips. */
export const inkOn = (hex: string) =>
  readableInk(hex, PURE_INK) === PURE_INK.dark ? "fill-on-cover" : "fill-on-cover-edge";
