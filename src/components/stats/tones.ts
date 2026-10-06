/** The categorical ramp, accent first then surface greys; a rainbow would imply meanings the data lacks. */
export const TONES = [
  "var(--color-accent-500)",
  "var(--color-accent-400)",
  "var(--color-surface-600)",
  "var(--color-surface-700)",
  "var(--color-surface-800)",
  "var(--color-graph-none)",
];

/** Ink over `TONES[i]`; keep the bare `i`, later treemap tiles fade to grey where accent ink vanishes. */
export const onAccent = (i: number) => (i < 2 ? "fill-accent-ink" : "fill-ink-300");
